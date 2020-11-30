/*eslint camelcase: ["error", {allow: ["template_id", "job_type", "cluster_id", "start_date", "end_date", "quick_date_range", "total_count"]}]*/
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { formatDateTime, formatSeconds } from '../Utilities/helpers';
import { useQueryParams } from '../Utilities/useQueryParams';
import styled from 'styled-components';
import LoadingState from '../Components/LoadingState';
import NoData from '../Components/NoData';
import { Paths } from '../paths';
import { stringify } from 'query-string';

import {
    Button,
    DataList,
    DataListItem as PFDataListItem,
    DataListCell as PFDataListCell,
    Modal,
    Label
} from '@patternfly/react-core';

import { CircleIcon } from '@patternfly/react-icons';

import {
    readJobExplorer
} from '../Api';

const success = (
    <CircleIcon
        size="sm"
        key="5"
        style={ { color: 'rgb(110, 198, 100)', marginRight: '5px' } }
    />
);
const fail = (
  <>
    <CircleIcon
        size="sm"
        key="5"
        style={ { color: 'rgb(163, 0, 0)', marginRight: '5px' } }
    />
    <span id="fail-icon">!</span>
  </>
);

const DataListCell = styled(PFDataListCell)`
  --pf-c-data-list__cell-cell--MarginRight: 0;
`;

const PFDataListItemNoBorder = styled(PFDataListItem)`
    border-bottom: none;
    margin-bottom: -20px;
`;

const DataListItem = styled(PFDataListItem)`
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 0 15px 10px 15px;
  justify-content: center;
  align-items: center;
`;

const DataListItemCompact = styled(DataListItem)`
  padding: 0;
  > .pf-c-data-list__cell {
    font-weight: 600;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const DataListCellCompact = styled(DataListCell)`
    padding: 7px;
`;

const DataListFocus = styled.div`
    display: grid;
    grid-template-columns: repeat(3, auto);
    grid-gap: 10px;
    padding: var(--pf-global--spacer--lg);
    background: #ebebeb;
    border: 1px solid #ccc;
    border-top: none;
    margin-bottom: 20px;
`;

const DataCellEnd = styled(DataListCell)`
  display: flex;
  justify-content: flex-end;
  align-items: center;
`;

const DataCellEndCompact = styled(DataCellEnd)`
    padding: 7px !important;
`;

const formatTopFailedTask = data => {
    if (!data) {
        return;
    }

    if (data && data[0]) {
        const percentage = Math.ceil(data[0].failed_count / data[0].total_failed_count * 100);
        return `${data[0].task_name} ${percentage}%`;
    }

    return `Unavailable`;
};

const formatSuccessRate = (successCount, totalCount) => Math.ceil(successCount / totalCount * 100) + '%';
const formatAvgRun = (elapsed, totalCount) => new Date(Math.ceil(elapsed / totalCount) * 1000).toISOString().substr(11, 8);
const formatTotalTime = elapsed => new Date(elapsed * 1000).toISOString().substr(11, 8);
const TemplatesList = ({ history, clusterId, templates, isLoading, queryParams, qp }) => {
    const [ isModalOpen, setIsModalOpen ] = useState(false);
    const [ selectedId, setSelectedId ] = useState(null);
    const [ selectedTemplate, setSelectedTemplate ] = useState([]);
    const [ relatedJobs, setRelatedJobs ] = useState([]);
    const [ stats, setStats ] = useState([]);

    const {
        urlMappedQueryParams
    } = useQueryParams({});

    const relatedTemplateJobsParams = {
        ...qp,
        templateId: [ selectedId ],
        attributes: [
            'id',
            'status',
            'job_type',
            'started',
            'finished',
            'elapsed',
            'created',
            'cluster_name',
            'org_name',
            'most_failed_tasks'
        ],
        groupByTime: false,
        limit: 5,
        sortBy: 'created:asc',
        quickDateRange: qp.quick_date_range ? qp.quick_date_range : 'last_30_days',
        jobType: [ 'job' ]
    };

    const agreggateTemplateParams = {
        groupBy: 'template',
        templateId: [ selectedId ],
        attributes: [
            'elapsed',
            'job_type',
            'most_failed_tasks',
            'successful_count',
            'failed_count',
            'total_count'
        ],
        status: qp.status,
        quickDateRange: qp.quick_date_range ? qp.quick_date_range : 'last_30_days',
        jobType: [ 'job' ]
    };

    useEffect(() => {
        const update = async () => {
            await window.insights.chrome.auth.getUser();
            readJobExplorer({ params: urlMappedQueryParams(agreggateTemplateParams) }).then(({ items: stats }) => {
                setStats(stats[0]);
            });
            // template jobs list
            readJobExplorer({ params: urlMappedQueryParams(relatedTemplateJobsParams) }).then(({ items: fooBar }) => {
                setRelatedJobs(fooBar);
            });
        };

        if (selectedId) {
            update();
        }

    }, [ selectedId ]);

    const redirectToJobExplorer = () => {
        const { jobExplorer } = Paths;
        const initialQueryParams = {
            template_id: selectedId,
            status: [ 'successful', 'failed', 'new', 'pending', 'waiting', 'error', 'canceled', 'running' ],
            job_type: [ 'job' ],
            start_date: queryParams.startDate,
            end_date: queryParams.endDate,
            quick_date_range: 'custom',
            cluster_id: clusterId
        };

        const search = stringify(initialQueryParams, { arrayFormat: 'bracket' });
        history.push({
            pathname: jobExplorer,
            search
        });
    };

    return (
    <>
      <DataList aria-label="Top Templates" style={ {
          maxHeight: '400px',
          overflow: 'auto',
          height: '400px',
          background: 'white'
      } }>
          <DataListItem aria-labelledby="top-templates-header">
              <DataListCell>
                  <h3>Top templates</h3>
              </DataListCell>
              <DataCellEnd>
                  <h3>Usage</h3>
              </DataCellEnd>
          </DataListItem>
          { isLoading && (
              <PFDataListItem
                  aria-labelledby="templates-loading"
                  key={ isLoading }
                  style={ { border: 'none' } }

              >
                  <PFDataListCell>
                      <LoadingState />
                  </PFDataListCell>
              </PFDataListItem>
          ) }
          { !isLoading && templates.length <= 0 && (
              <PFDataListItem
                  aria-labelledby="templates-no-data"
                  key={ isLoading }
                  style={ { border: 'none' } }
              >
                  <PFDataListCell>
                      <NoData />
                  </PFDataListCell>
              </PFDataListItem>
          ) }
          { !isLoading && templates.map(({ name, total_count, id }, index) => (
              <DataListItem aria-labelledby="top-templates-detail" key={ index }>
                  <DataListCell>
                      <a
                          onClick={ () => {
                              setIsModalOpen(true);
                              setSelectedId(id);
                          } }
                      >
                          { name }
                      </a>
                  </DataListCell>
                  <DataCellEnd>
                      { total_count }
                  </DataCellEnd>
              </DataListItem>
          )) }
      </DataList>
      { selectedTemplate && selectedTemplate !== [] && (
          <Modal
              width={ '80%' }
              title={ stats.name ? stats.name : 'no-template-name' }
              isOpen={ isModalOpen }
              onClose={ () => {
                  setIsModalOpen(false);
                  setSelectedTemplate([]);
                  setRelatedJobs([]);
                  setSelectedId(null);
              } }
              actions={ [
                  <Button
                      key="cancel"
                      variant="secondary"
                      onClick={ () => {
                          setIsModalOpen(false);
                          setSelectedTemplate([]);
                          setRelatedJobs([]);
                          setSelectedId(null);
                      } }
                  >
              Close
                  </Button>
              ] }
          >
              <DataList aria-label="Selected Template Details">
                  <PFDataListItemNoBorder
                      aria-labelledby="Selected Template Statistics"
                  >
                      <DataListFocus>
                          <div aria-labelledby="job runs">
                              <b style={ { marginRight: '10px' } }>Number of runs</b>
                              { stats.total_count ?
                                  stats.total_count : 'Unavailable' }
                          </div>
                          <div aria-labelledby="total time">
                              <b style={ { marginRight: '10px' } }>Total time</b>
                              { stats.elapsed ?
                                  formatTotalTime(stats.elapsed) : 'Unavailable' }
                          </div>
                          <div aria-labelledby="Avg Time">
                              <b style={ { marginRight: '10px' } }>Avg time</b>
                              { stats.elapsed ?
                                  formatAvgRun(stats.elapsed, stats.total_count) : 'Unavailable' }
                          </div>
                          <div aria-labelledby="success rate">
                              <b style={ { marginRight: '10px' } }>Success rate</b>
                              { !isNaN(stats.successful_count) ?
                                  formatSuccessRate(stats.successful_count, stats.total_count) : 'Unavailable' }
                          </div>
                          <div aria-labelledby="most failed task">
                              <b style={ { marginRight: '10px' } }>Most failed task</b>
                              { stats.most_failed_tasks ?
                                  formatTopFailedTask(stats.most_failed_tasks) : 'Unavailable' }
                          </div>
                      </DataListFocus>
                  </PFDataListItemNoBorder>
                  <DataListItemCompact>
                      <DataListCellCompact key="last5jobs">
                          <Label variant="outline">Last 5 jobs</Label>
                      </DataListCellCompact>,
                      <DataCellEndCompact>
                          <Button component="a" onClick={ redirectToJobExplorer } variant="link">
                              View all jobs
                          </Button>
                      </DataCellEndCompact>
                  </DataListItemCompact>
                  <DataListItemCompact aria-labelledby="datalist header">
                      <PFDataListCell key="job heading">Id/Name</PFDataListCell>
                      <PFDataListCell key="cluster heading">Cluster</PFDataListCell>
                      <PFDataListCell key="start time heading">Start Time</PFDataListCell>
                      <PFDataListCell key="total time heading">Total Time</PFDataListCell>
                  </DataListItemCompact>
                  { relatedJobs.length <= 0 && <LoadingState /> }
                  { relatedJobs.length > 0 &&
              relatedJobs.map((job, index) => (
                  <DataListItem
                      style={ { padding: '10px 0' } }
                      key={ `job-details-${index}` }
                      aria-labelledby="job details"
                  >
                      <PFDataListCell key="job name">
                          { job.status === 'successful' ? success : fail }{ ' ' }
                          { job.id.id } - { job.id.template_name }
                      </PFDataListCell>
                      <PFDataListCell key="job cluster">
                          { job.cluster_name }
                      </PFDataListCell>
                      <PFDataListCell key="start time">
                          { formatDateTime(job.started) }
                      </PFDataListCell>
                      <PFDataListCell key="total time">
                          { formatSeconds(job.elapsed) }
                      </PFDataListCell>
                  </DataListItem>
              )) }
              </DataList>
          </Modal>
      ) }
    </>
    );
};

TemplatesList.propTypes = {
    templates: PropTypes.array,
    isLoading: PropTypes.bool,
    queryParams: PropTypes.object
};

export default TemplatesList;
