import * as React from 'react';
import * as _ from 'lodash';
import { Stack, StackItem, Card, CardTitle, SplitItem, Split, Label } from '@patternfly/react-core';
import { ExternalLink, ResourceIcon } from '@console/internal/components/utils';
import { ConsoleLinkModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import GitOpsServiceDetailsSection from './GitOpsServiceDetailsSection';
import { GitOpsEnvironment } from '../utils/gitops-types';
import './GitOpsDetails.scss';

interface GitOpsDetailsProps {
  envs: GitOpsEnvironment[];
  appName: string;
}

const GitOpsDetails: React.FC<GitOpsDetailsProps> = ({ envs, appName }) => {
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const argocdLink = _.find(
    consoleLinks,
    (link: K8sResourceKind) =>
      link.metadata?.name === 'argocd' && link.spec?.location === 'ApplicationMenu',
  );
  return (
    <div className="odc-gitops-details">
      {_.map(
        envs,
        (env) =>
          env && (
            <Stack className="odc-gitops-details__env-section" key={env.environment}>
              <StackItem>
                <Card>
                  <CardTitle className="odc-gitops-details__env-section__header">
                    <Stack hasGutter>
                      <StackItem>
                        <Split style={{ alignItems: 'center' }} hasGutter>
                          <SplitItem
                            className="odc-gitops-details__env-section__title co-truncate co-nowrap"
                            isFilled
                          >
                            {env.environment}
                          </SplitItem>
                          <SplitItem>
                            <Label
                              className="odc-gitops-details__env-section__timestamp"
                              color="grey"
                            >
                              <span style={{ color: 'var(--pf-global--palette--black-600)' }}>
                                {env.timestamp}
                              </span>
                            </Label>
                          </SplitItem>
                        </Split>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        {env.cluster ? (
                          <ExternalLink
                            additionalClassName="odc-gitops-details__env-section__url"
                            href={env.cluster}
                            text={env.cluster}
                          />
                        ) : (
                          <div className="odc-gitops-details__env-section__url-empty-state">
                            Cluster URL not available
                          </div>
                        )}
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        <span className="co-resource-item">
                          <ResourceIcon kind="Project" />
                          <span className="co-resource-item__resource-name">{env.environment}</span>
                        </span>
                      </StackItem>
                      <StackItem className="co-truncate co-nowrap">
                        {env.environment && (
                          <ExternalLink
                            href={`${argocdLink.spec.href}/applications/${env.environment}-${appName}`}
                            text="Argo CD"
                          />
                        )}
                      </StackItem>
                    </Stack>
                  </CardTitle>
                </Card>
              </StackItem>
              <GitOpsServiceDetailsSection services={env.services} />
            </Stack>
          ),
      )}
    </div>
  );
};

export default GitOpsDetails;
