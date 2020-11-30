import { TFunction } from 'i18next';
import { sortable } from '@patternfly/react-table';

export const tableColumnClasses = {
  name: 'col-lg-4 col-md-4 col-sm-4 col-xs-6',
  type: 'col-lg-2 col-md-2 col-sm-4 col-xs-6',
  status: 'col-lg-2 col-md-3 col-sm-4 hidden-xs',
  created: 'col-lg-4 col-md-3 hidden-sm hidden-xs',
};

const HelmReleaseResourcesHeader = (t: TFunction) => () => {
  return [
    {
      title: t('devconsole~Name'),
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses.name },
    },
    {
      title: t('devconsole~Type'),
      sortField: 'kind',
      transforms: [sortable],
      props: { className: tableColumnClasses.type },
    },
    {
      title: t('devconsole~Status'),
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses.status },
    },
    {
      title: t('devconsole~Created'),
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnClasses.created },
    },
  ];
};

export default HelmReleaseResourcesHeader;
