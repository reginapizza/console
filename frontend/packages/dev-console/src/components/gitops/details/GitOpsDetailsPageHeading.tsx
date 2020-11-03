import * as React from 'react';
import { BreadCrumbs, ResourceIcon, ExternalLink } from '@console/internal/components/utils';
import { Split, SplitItem, Label } from '@patternfly/react-core';
import { routeDecoratorIcon } from '../../import/render-utils';
// import { ExternalLinkAltIcon, LinkIcon } from '@patternfly/react-icons';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import './GitOpsDetailsPageHeading.scss';

import * as _ from 'lodash';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConsoleLinkModel } from '@console/internal/models';

interface GitOpsDetailsPageHeadingProps {
  url: string;
  appName: string;
  manifestURL: string;
  // argoURL: string;
  badge?: React.ReactNode;
}

const GitOpsDetailsPageHeading: React.FC<GitOpsDetailsPageHeadingProps> = ({
  url,
  appName,
  manifestURL,
  // argoURL,
  badge,
}) => {
  const breadcrumbs = [
    {
      name: 'Application Stages',
      path: '/applicationstages',
    },
    {
      name: 'Application Details',
      path: `${url}`,
    },
  ];

<<<<<<< HEAD
  const argoURL =
    'https://argocd-server-argocd.apps.dev-svc-4.6-103007.devcluster.openshift.com/applications';
=======
  const [consoleLinks] = useK8sWatchResource({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  let aLink;
  _.filter(consoleLinks, (link: any) => {
    if (link.spec.location === 'ApplicationMenu') {
      aLink = link;
      return true;
    }
    return false;
  });
>>>>>>> f119ea6aed30732b569e4e9da2c75c7fb51c5fef

  return (
    <div className="odc-gitops-details-page-heading co-m-nav-title co-m-nav-title--breadcrumbs">
      <BreadCrumbs breadcrumbs={breadcrumbs} />
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">
          <ResourceIcon kind="application" className="co-m-resource-icon--lg" />
          <span className="co-resource-item__resource-name">{appName}</span>
        </div>
        {badge && <span className="co-m-pane__heading-badge">{badge}</span>}
      </h1>
      <Split className="odc-gitops-details-page-heading__repo" hasGutter>
        <SplitItem>Manifest File Repo:</SplitItem>
        <SplitItem isFilled>
          <Label
            style={{ fontSize: '12px' }}
            color="blue"
            icon={routeDecoratorIcon(manifestURL, 12)}
          >
            <a
              style={{ color: 'var(--pf-c-label__content--Color)' }}
              href={manifestURL}
              rel="noopener noreferrer"
              target="_blank"
            >
              {manifestURL}
            </a>
          </Label>
        </SplitItem>
      </Split>
<<<<<<< HEAD
      <Split className="odc-gitops-details-page-heading__argocd" hasGutter>
        <SplitItem>Argo CD:</SplitItem>
        <SplitItem isFilled>
          <a href={argoURL} rel="noopener noreferrer" target="_blank">
            https://argocd-server-argocd.apps.dev-svc-4.6-103007.devcluster.openshift.com/applications
            <ExternalLinkAltIcon style={{ fontSize: 12, marginLeft: 5, marginRight: 5 }} />
          </a>
        </SplitItem>
=======
      <Split className="odc-gitops-details-page-heading__repo" hasGutter>
        {aLink && (
          <>
            <SplitItem>{aLink.spec.text}:</SplitItem>
            <dd>
              <ExternalLink href={aLink.spec.href} text={aLink.spec.href} />
            </dd>
          </>
        )}
>>>>>>> f119ea6aed30732b569e4e9da2c75c7fb51c5fef
      </Split>
    </div>
  );
};

export default GitOpsDetailsPageHeading;
