import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { observer } from '@patternfly/react-topology';
import { StatusBox } from '@console/internal/components/utils';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import TopologyView from './TopologyView';
import { TopologyViewType } from '../../topology-types';
import { FilterProvider } from '../../filters/FilterProvider';

interface TopologyDataRendererProps {
  viewType: TopologyViewType;
}

const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = observer(({ viewType }) => {
  const { t } = useTranslation();
  const { namespace, model, loaded, loadError } = React.useContext<ExtensibleModel>(ModelContext);

  return (
    <StatusBox
      skeleton={
        viewType === TopologyViewType.list && (
          <div className="co-m-pane__body skeleton-overview">
            <div className="skeleton-overview--head" />
            <div className="skeleton-overview--tile" />
            <div className="skeleton-overview--tile" />
            <div className="skeleton-overview--tile" />
          </div>
        )
      }
      data={model}
      label={t('topology~Topology')}
      loaded={loaded}
      loadError={loadError}
    >
      <FilterProvider>
        <TopologyView viewType={viewType} model={model} namespace={namespace} />
      </FilterProvider>
    </StatusBox>
  );
});

export default TopologyDataRenderer;
