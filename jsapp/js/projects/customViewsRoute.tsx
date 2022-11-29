import React, {useState} from 'react';
import type {
  ProjectsFilterDefinition,
  ProjectFieldName,
} from './projectsView/projectsViewConstants';
import ProjectsFilter from './projectsView/projectsFilter';
import ProjectsFieldsSelector from './projectsView/projectsFieldsSelector';

import ProjectsTable from 'js/projects/projectsTable/projectsTable';
import type {OrderDirection} from 'js/projects/projectsTable/projectsTableConstants';
import {ProjectsTableContextName} from 'js/projects/projectsTable/projectsTableConstants';
import mockAssets from './assetsResponseMock';

export default function CustomViewsRoute() {
  const [filters, setFilters] = useState<ProjectsFilterDefinition[]>([]);
  const [fields, setFields] = useState<ProjectFieldName[] | undefined>([]);

  return (
    <section style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>
      <h1>Projects View temporary demo</h1>

      <ProjectsFilter
        onFiltersChange={setFilters}
        filters={filters}
      />

      <ProjectsFieldsSelector
        onFieldsChange={setFields}
        selectedFields={fields}
      />

      <ProjectsTable
        context={ProjectsTableContextName.MY_LIBRARY}
        assets={mockAssets.results}
        totalAssets={mockAssets.count}
        metadata={mockAssets.metadata}
        orderColumnId='name'
        orderValue='ascending'
        onOrderChange={(columnId: string, columnValue: OrderDirection) => console.log(columnId, columnValue)}
        filterColumnId={null}
        filterValue={null}
        onFilterChange={(columnId: string | null, columnValue: string | null) => console.log(columnId, columnValue)}
      />
    </section>
  );
}
