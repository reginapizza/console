import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import FormSection from '../section/FormSection';

export interface DevfileSectionProps {
  buildStrategy: string;
}

const DevfileSection: React.FC<DevfileSectionProps> = ({ buildStrategy }) =>
  buildStrategy === 'Devfile' && (
    <FormSection title="Devfile">
      <InputField
        type={TextInputTypes.text}
        name="docker.dockerfilePath"
        label="Devfile Path //test"
        helpText="Allows the builds to use a different path to locate your Dockerfile, relative to the Context Dir field."
      />
      <InputField
        type={TextInputTypes.number}
        name="docker.containerPort"
        label="Container Port"
        helpText="Port number the container exposes."
        style={{ maxWidth: '100%' }}
      />
    </FormSection>
  );

export default DevfileSection;
