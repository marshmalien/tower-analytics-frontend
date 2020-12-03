/* eslint-disable max-len */
/*eslint camelcase: ["error", {allow: ["setStart_Date","setEnd_Date","cluster_id","org_id","job_type","template_id","quick_date_range","sort_by", "start_date", "end_date", "group_by_time", "group_by"]}]*/

import React, { useState, useEffect } from 'react';

import { useQueryParams } from '../../Utilities/useQueryParams';

import LoadingState from '../../Components/LoadingState';
import EmptyState from '../../Components/EmptyState';
import {
    preflightRequest,
    readClustersOptions,
    readJobExplorer,
    readEventExplorer
} from '../../Api';

import { jobExplorer } from '../../Utilities/constants';

import {
    Main,
    PageHeader,
    PageHeaderTitle
} from '@redhat-cloud-services/frontend-components';

import {
    Card,
    CardBody,
    CardTitle as PFCardTitle
} from '@patternfly/react-core';

import BarChart from '../../Charts/BarChart';
import LineChart from '../../Charts/LineChart';
import ModulesList from '../../Components/ModulesList';
import TemplatesList from '../../Components/TemplatesList';
import FilterableToolbar from '../../Components/Toolbar';
import { clusters } from '../../Utilities/constants';

const topTemplateParams = {
    groupBy: 'template',
    limit: 10,
    jobType: [ 'job' ],
    groupByTime: false
};

const topWorkflowParams = {
    groupBy: 'template',
    limit: 10,
    jobType: [ 'workflowjob' ],
    groupByTime: false
};

const moduleParams = {
    groupBy: 'module',
    sortBy: 'host_task_count:desc'
};

const Clusters = ({ history }) => {
    const [ preflightError, setPreFlightError ] = useState(null);
    const [ barChartData, setBarChartData ] = useState([]);
    const [ lineChartData, setLineChartData ] = useState([]);
    const [ templatesData, setTemplatesData ] = useState([]);
    const [ workflowData, setWorkflowsData ] = useState([]);
    const [ modulesData, setModulesData ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(true);

    const [ orgIds, setOrgIds ] = useState([]);
    const [ clusterIds, setClusterIds ] = useState([]);
    const [ templateIds, setTemplateIds ] = useState([]);
    const [ sortBy, setSortBy ] = useState(null);
    const [ statuses, setStatuses ] = useState([]);
    const [ jobTypes, setJobTypes ] = useState([]);
    const [ quickDateRanges, setQuickDateRanges ] = useState([]);
    const {
        queryParams,
        urlMappedQueryParams,
        setFromToolbar
    } = useQueryParams({ ...clusters.defaultParams });

    const initialOptionsParams = {
        attributes: jobExplorer.attributes
    };

    const { queryParams: optionsQueryParams } = useQueryParams(
        initialOptionsParams
    );

    const topTemplatesParams = {
        ...queryParams,
        ...topTemplateParams
    };
    useEffect(() => {
        let ignore = false;

        const fetchEndpoints = () => {
            return Promise.all(
                [
                    readJobExplorer({ params: urlMappedQueryParams(queryParams) }),
                    readJobExplorer({ params: urlMappedQueryParams(topTemplatesParams) }),
                    readJobExplorer({ params: urlMappedQueryParams(topWorkflowParams) }),
                    readEventExplorer({ params: urlMappedQueryParams(moduleParams) }),
                    readClustersOptions({ params: optionsQueryParams })
                ].map(p => p.catch(() => []))
            );
        };

        async function initializeWithPreflight() {
            setIsLoading(true);
            await window.insights.chrome.auth.getUser();
            await preflightRequest().catch(error => {
                setPreFlightError({ preflightError: error });
            });
            fetchEndpoints().then(
                ([
                    { items: jobExplorerData = []},
                    { items: templatesData = []},
                    { items: workflowData = []},
                    { items: modulesData = []},
                    {
                        cluster_id,
                        org_id,
                        job_type,
                        status,
                        template_id,
                        quick_date_range,
                        sort_by
                    }
                ]) => {
                    if (!ignore) {
                        queryParams.cluster_id ? setLineChartData(jobExplorerData) : setBarChartData(jobExplorerData);
                        setTemplatesData(templatesData);
                        setModulesData(modulesData);
                        setWorkflowsData(workflowData);
                        setClusterIds(cluster_id);
                        setOrgIds(org_id);
                        setTemplateIds(template_id);
                        setSortBy(sort_by);
                        setStatuses(status);
                        setJobTypes(job_type);
                        setQuickDateRanges(quick_date_range);
                        setIsLoading(false);

                    }
                }
            );
        }

        initializeWithPreflight();

        return () => (ignore = true);
    }, []);

    // Get and update the data
    useEffect(() => {
        const update = () => {
            readJobExplorer({ params: urlMappedQueryParams(queryParams) }).then(({ items: chartData }) => {
                queryParams.clusterId.length > 0 ? setLineChartData(chartData) : setBarChartData(chartData);
            });
            readJobExplorer({ params: topTemplatesParams }).then(({ items: templatesData }) => {
                setTemplatesData(templatesData);
            });
            readEventExplorer({ params: urlMappedQueryParams(moduleParams) }).then(({ items: modulesData }) => {
                setModulesData(modulesData);
            });
        };

        setIsLoading(true);
        new Promise(update).finally(setIsLoading(false));
    }, [ queryParams ]);

    return (
        <React.Fragment>
            <PageHeader>
                <PageHeaderTitle title={ 'Clusters' } />
                <FilterableToolbar
                    categories={ {
                        status: statuses,
                        quickDateRange: quickDateRanges,
                        jobType: jobTypes,
                        orgId: orgIds,
                        clusterId: clusterIds,
                        templateId: templateIds,
                        sortBy
                    } }
                    filters={ queryParams }
                    setFilters={ setFromToolbar }
                />
            </PageHeader>
            { preflightError && (
                <Main>
                    <EmptyState { ...preflightError } />
                </Main>
            ) }
            { !preflightError && (
        <>
          <Main>
              <Card>
                  <PFCardTitle>
                      <h2>Job status</h2>
                  </PFCardTitle>
                  <CardBody>
                      { isLoading && !preflightError && <LoadingState /> }
                      { queryParams.clusterId.length <= 0 &&
                  barChartData.length > 0 &&
                  !isLoading && (
                          <BarChart
                              margin={ { top: 20, right: 20, bottom: 50, left: 70 } }
                              id="d3-bar-chart-root"
                              data={ barChartData }
                              value={ barChartData.length }
                          />
                      ) }
                      { queryParams.clusterId.length > 0  &&
                  lineChartData.length > 0 &&
                  !isLoading && (
                          <LineChart
                              margin={ { top: 20, right: 20, bottom: 50, left: 70 } }
                              id="d3-line-chart-root"
                              data={ lineChartData }
                              value={ lineChartData.length }
                              clusterId={ queryParams.cluster_id }
                          />
                      ) }
                  </CardBody>
              </Card>
              <div
                  className="dataCard"
                  style={ { display: 'flex', marginTop: '20px' } }
              >
                  <TemplatesList
                      history={ history }
                      queryParams={ queryParams }
                      qp={ urlMappedQueryParams(queryParams) }
                      clusterId={ queryParams.cluster_id }
                      templates={ workflowData }
                      isLoading={ isLoading }
                      title={ 'Top workflows' }
                  />
                  <TemplatesList
                      history={ history }
                      queryParams={ queryParams }
                      qp={ urlMappedQueryParams(queryParams) }
                      clusterId={ queryParams.cluster_id }
                      templates={ templatesData }
                      isLoading={ isLoading }
                      title={ 'Top templates' }
                  />
                  <ModulesList
                      modules={ modulesData }
                      isLoading={ isLoading }
                  />
              </div>
          </Main>
        </>
            ) }
        </React.Fragment>
    );
};

export default Clusters;
