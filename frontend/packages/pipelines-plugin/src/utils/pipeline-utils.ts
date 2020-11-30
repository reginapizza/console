import * as _ from 'lodash';
import { formatDuration } from '@console/internal/components/utils/datetime';
import {
  ContainerStatus,
  K8sResourceKind,
  k8sUpdate,
  k8sGet,
  SecretKind,
  K8sResourceCommon,
  K8sKind,
} from '@console/internal/module/k8s';
import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import { ServiceAccountModel } from '@console/internal/models';
import { errorModal } from '@console/internal/components/modals/error-modal';
import { PIPELINE_SERVICE_ACCOUNT, SecretAnnotationId } from '../components/pipelines/const';
import { PipelineModalFormWorkspace } from '../components/pipelines/modals/common/types';
import {
  getLatestRun,
  PipelineRun,
  runStatus,
  PipelineParam,
  PipelineRunParam,
  PipelineTaskRef,
  PipelineRunWorkspace,
  TaskRunKind,
  PipelineTask,
} from './pipeline-augment';
import { pipelineRunFilterReducer, pipelineRunStatus } from './pipeline-filter-reducer';
import {
  PipelineRunModel,
  TaskRunModel,
  PipelineResourceModel,
  ConditionModel,
  ClusterTaskModel,
  TriggerTemplateModel,
  TriggerBindingModel,
  ClusterTriggerBindingModel,
  PipelineModel,
  TaskModel,
  EventListenerModel,
} from '../models';

interface Resources {
  inputs?: Resource[];
  outputs?: Resource[];
}

interface Resource {
  name: string;
  resource?: string;
  from?: string[];
}
export type ServiceAccountType = {
  secrets: { [name: string]: string }[];
} & K8sResourceCommon;

export interface PipelineVisualizationTaskItem {
  name: string;
  resources?: Resources;
  params?: object;
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
}

export const TaskStatusClassNameMap = {
  'In Progress': 'is-running',
  Succeeded: 'is-done',
  Failed: 'is-error',
  Idle: 'is-idle',
};

export const conditions = {
  hasFromDependency: (task: PipelineVisualizationTaskItem): boolean =>
    task.resources &&
    task.resources.inputs &&
    task.resources.inputs.length > 0 &&
    !!task.resources.inputs[0].from,
  hasRunAfterDependency: (task: PipelineVisualizationTaskItem): boolean =>
    task.runAfter && task.runAfter.length > 0,
};

export enum ListFilterId {
  Running = 'Running',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Cancelled = 'Cancelled',
  Other = '-',
}

export const ListFilterLabels = {
  [ListFilterId.Running]: 'Running',
  [ListFilterId.Failed]: 'Failed',
  [ListFilterId.Succeeded]: 'Succeeded',
  [ListFilterId.Cancelled]: 'Cancelled',
  [ListFilterId.Other]: 'Other',
};

export enum PipelineResourceListFilterId {
  Git = 'git',
  PullRequest = 'pullRequest',
  Image = 'image',
  Cluster = 'cluster',
  Storage = 'storage',
  CloudEvent = 'cloudEvent',
}

export const PipelineResourceListFilterLabels = {
  [PipelineResourceListFilterId.Git]: 'Git',
  [PipelineResourceListFilterId.PullRequest]: 'Pull Request',
  [PipelineResourceListFilterId.Image]: 'Image',
  [PipelineResourceListFilterId.Cluster]: 'Cluster',
  [PipelineResourceListFilterId.Storage]: 'Storage',
  [PipelineResourceListFilterId.CloudEvent]: 'Cloud Event',
};

// to be used by both Pipeline and Pipelinerun visualisation
const sortTasksByRunAfterAndFrom = (
  tasks: PipelineVisualizationTaskItem[],
): PipelineVisualizationTaskItem[] => {
  // check and sort tasks by 'runAfter' and 'from' dependency
  const output = tasks;
  for (let i = 0; i < output.length; i++) {
    let flag = -1;
    if (conditions.hasRunAfterDependency(output[i])) {
      for (let j = 0; j < output.length; j++) {
        if (i < j && output[j].taskRef.name === output[i].runAfter[output[i].runAfter.length - 1]) {
          flag = j;
        }
      }
    } else if (conditions.hasFromDependency(output[i])) {
      for (let j = i + 1; j < output.length; j++) {
        if (output[j].taskRef.name === output[i].resources.inputs[0].from[0]) {
          flag = j;
        }
      }
    }
    if (flag > -1) {
      // swap with last matching task
      const temp = output[flag];
      output[flag] = output[i];
      output[i] = temp;
    }
  }
  return output;
};

/**
 * Appends the pipeline run status to each tasks in the pipeline.
 * @param pipeline
 * @param pipelineRun
 */
const appendPipelineRunStatus = (pipeline, pipelineRun) => {
  return _.map(pipeline.spec.tasks, (task) => {
    if (!pipelineRun.status) {
      return task;
    }
    if (pipelineRun.status && !pipelineRun.status.taskRuns) {
      return _.merge(task, { status: { reason: runStatus.Failed } });
    }
    const mTask = _.merge(task, {
      status: _.get(_.find(pipelineRun.status.taskRuns, { pipelineTaskName: task.name }), 'status'),
    });
    // append task duration
    if (mTask.status && mTask.status.completionTime && mTask.status.startTime) {
      const date =
        new Date(mTask.status.completionTime).getTime() -
        new Date(mTask.status.startTime).getTime();
      mTask.status.duration = formatDuration(date);
    }
    // append task status
    if (!mTask.status) {
      mTask.status = { reason: runStatus.Idle };
    } else if (mTask.status && mTask.status.conditions) {
      mTask.status.reason = pipelineRunStatus(mTask) || runStatus.Idle;
    }
    return mTask;
  });
};
export const hasInlineTaskSpec = (tasks: PipelineTask[] = []): boolean =>
  tasks.some((task) => !!(task.taskSpec && !task.taskRef));

export const getPipelineTasks = (
  pipeline: K8sResourceKind,
  pipelineRun: K8sResourceKind = {
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
  },
): PipelineVisualizationTaskItem[][] => {
  // Each unit in 'out' array is termed as stage | out = [stage1 = [task1], stage2 = [task2,task3], stage3 = [task4]]
  const out = [];
  if (!pipeline.spec?.tasks || _.isEmpty(pipeline.spec.tasks)) {
    return out;
  }
  const taskList = appendPipelineRunStatus(pipeline, pipelineRun);
  // Step 1: Sort Tasks to get in correct order
  const tasks = sortTasksByRunAfterAndFrom(taskList);

  // Step 2: Push all nodes without any dependencies in different stages
  tasks.forEach((task) => {
    if (!conditions.hasFromDependency(task) && !conditions.hasRunAfterDependency(task)) {
      if (out.length === 0) {
        out.push([]);
      }
      out[0].push(task);
    }
  });

  // Step 3: Push nodes with 'from' dependency and stack similar tasks in a stage
  tasks.forEach((task) => {
    if (!conditions.hasRunAfterDependency(task) && conditions.hasFromDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (
            t.taskRef.name === task.resources.inputs[0].from[0] ||
            t.name === task.resources.inputs[0].from[0]
          ) {
            flag = i;
          }
        }
      }
      const nextToFlag = out[flag + 1] ? out[flag + 1] : null;
      if (
        nextToFlag &&
        nextToFlag[0] &&
        nextToFlag[0].resources &&
        nextToFlag[0].resources.inputs &&
        nextToFlag[0].resources.inputs[0] &&
        nextToFlag[0].resources.inputs[0].from &&
        nextToFlag[0].resources.inputs[0].from[0] &&
        nextToFlag[0].resources.inputs[0].from[0] === task.resources.inputs[0].from[0]
      ) {
        nextToFlag.push(task);
      } else {
        out.splice(flag + 1, 0, [task]);
      }
    }
  });

  // Step 4: Push nodes with 'runAfter' dependencies and stack similar tasks in a stage
  tasks.forEach((task) => {
    if (conditions.hasRunAfterDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (t.taskRef.name === task.runAfter[0] || t.name === task.runAfter[0]) {
            flag = i;
          }
        }
      }
      const nextToFlag = out[flag + 1] ? out[flag + 1] : null;
      if (
        nextToFlag &&
        nextToFlag[0].runAfter &&
        nextToFlag[0].runAfter[0] &&
        nextToFlag[0].runAfter[0] === task.runAfter[0]
      ) {
        nextToFlag.push(task);
      } else {
        out.splice(flag + 1, 0, [task]);
      }
    }
  });
  return out;
};

export const containerToLogSourceStatus = (container: ContainerStatus): string => {
  if (!container) {
    return LOG_SOURCE_WAITING;
  }
  const { state, lastState } = container;
  if (state.waiting && !_.isEmpty(lastState)) {
    return LOG_SOURCE_RESTARTING;
  }
  if (state.waiting) {
    return LOG_SOURCE_WAITING;
  }
  if (state.terminated) {
    return LOG_SOURCE_TERMINATED;
  }
  return LOG_SOURCE_RUNNING;
};

export type LatestPipelineRunStatus = {
  latestPipelineRun: PipelineRun;
  status: string;
};

/**
 * Takes pipeline runs and produces a latest pipeline run state.
 */
export const getLatestPipelineRunStatus = (
  pipelineRuns: PipelineRun[],
): LatestPipelineRunStatus => {
  if (!pipelineRuns || pipelineRuns.length === 0) {
    // Not enough data to build the current state
    return { latestPipelineRun: null, status: runStatus.PipelineNotStarted };
  }

  const latestPipelineRun = getLatestRun({ data: pipelineRuns }, 'creationTimestamp');

  if (!latestPipelineRun) {
    // Without the latestRun we will not have progress to show
    return { latestPipelineRun: null, status: runStatus.PipelineNotStarted };
  }

  let status: string = pipelineRunFilterReducer(latestPipelineRun);
  if (status === '-') {
    status = runStatus.Pending;
  }

  return {
    latestPipelineRun,
    status,
  };
};

export const getPipelineRunParams = (pipelineParams: PipelineParam[]): PipelineRunParam[] => {
  return (
    pipelineParams &&
    pipelineParams.map((param) => ({
      name: param.name,
      value: param.default,
    }))
  );
};

export const getPipelineRunWorkspaces = (
  pipelineWorkspaces: PipelineModalFormWorkspace[],
): PipelineRunWorkspace[] => {
  return (
    pipelineWorkspaces &&
    pipelineWorkspaces.map((workspace) => ({
      name: workspace.name,
      ...workspace.data,
    }))
  );
};

export const calculateRelativeTime = (startTime: string, completionTime?: string) => {
  const start = new Date(startTime).getTime();
  const end = completionTime ? new Date(completionTime).getTime() : new Date().getTime();
  const secondsAgo = (end - start) / 1000;
  const minutesAgo = secondsAgo / 60;
  const hoursAgo = minutesAgo / 60;

  if (minutesAgo > 90) {
    const count = Math.round(hoursAgo);
    return `about ${count} hours`;
  }
  if (minutesAgo > 45) {
    return 'about an hour';
  }
  if (secondsAgo > 90) {
    const count = Math.round(minutesAgo);
    return `about ${count} minutes`;
  }
  if (secondsAgo > 45) {
    return 'about a minute';
  }
  return 'a few seconds';
};

export const pipelineRunDuration = (run: PipelineRun | TaskRunKind): string => {
  const startTime = _.get(run, ['status', 'startTime'], null);
  const completionTime = _.get(run, ['status', 'completionTime'], null);

  // Duration cannot be computed if start time is missing or a completed/failed pipeline/task has no end time
  if (!startTime || (!completionTime && pipelineRunStatus(run) !== 'Running')) {
    return '-';
  }
  return calculateRelativeTime(startTime, completionTime);
};

export const updateServiceAccount = (
  secretName: string,
  originalServiceAccount: ServiceAccountType,
): Promise<ServiceAccountType> => {
  const updatedServiceAccount = _.cloneDeep(originalServiceAccount);
  updatedServiceAccount.secrets = [...updatedServiceAccount.secrets, { name: secretName }];
  return k8sUpdate(ServiceAccountModel, updatedServiceAccount);
};

export const associateServiceAccountToSecret = (secret: SecretKind, namespace: string) => {
  k8sGet(ServiceAccountModel, PIPELINE_SERVICE_ACCOUNT, namespace)
    .then((serviceAccount) => {
      if (_.find(serviceAccount.secrets, (s) => s.name === secret.metadata.name) === undefined) {
        updateServiceAccount(secret.metadata.name, serviceAccount);
      }
    })
    .catch((err) => {
      errorModal({ error: err.message });
    });
};

type KeyValuePair = {
  key: string;
  value: string;
};
export const getSecretAnnotations = (annotation: KeyValuePair) => {
  const annotations = {};
  const annotationPrefix = 'tekton.dev';
  if (annotation?.key === SecretAnnotationId.Git) {
    annotations[`${annotationPrefix}/${SecretAnnotationId.Git}-0`] = annotation?.value;
  } else if (annotation?.key === SecretAnnotationId.Image) {
    annotations[`${annotationPrefix}/${SecretAnnotationId.Image}-0`] = annotation?.value;
  }
  return annotations;
};

export const pipelinesTab = (kindObj: K8sKind) => {
  switch (kindObj.kind) {
    case PipelineModel.kind:
    case TaskModel.kind:
    case EventListenerModel.kind:
      return '';
    case PipelineRunModel.kind:
      return 'pipeline-runs';
    case PipelineResourceModel.kind:
      return 'pipeline-resources';
    case ConditionModel.kind:
      return 'conditions';
    case TaskRunModel.kind:
      return 'task-runs';
    case ClusterTaskModel.kind:
      return 'cluster-tasks';
    case TriggerTemplateModel.kind:
      return 'trigger-templates';
    case TriggerBindingModel.kind:
      return 'trigger-bindings';
    case ClusterTriggerBindingModel.kind:
      return 'cluster-trigger-bindings';
    default:
      return null;
  }
};
