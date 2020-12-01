/* eslint-disable max-len */
/*eslint camelcase: ["error", {allow: ["setStart_Date","setEnd_Date","cluster_id","org_id","job_type","template_id","quick_date_range","sort_by", "start_date", "end_date", "group_by_time", "group_by"]}]*/

import React, { useState, useEffect } from 'react';

import { useQueryParams } from '../../Utilities/useQueryParams';

import LoadingState from '../../Components/LoadingState';
import EmptyState from '../../Components/EmptyState';
import {
    preflightRequest,
    readJobExplorerOptions,
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
<<<<<<< HEAD
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
    sortBy: 'host_task_count:desc',
=======

const title = (
    <span style={ { fontWeight: 400 } }>
    Automation Analytics
        <span style={ { fontSize: '16px', fontWeight: 400 } }>
            { ' ' }
            <span style={ { margin: '0 10px' } }>|</span> Clusters
        </span>
    </span>
);

const initialQueryParams = {
    start_date: moment
    .utc()
    .subtract(1, 'month')
    .format('YYYY-MM-DD'),
    end_date: moment.utc().format('YYYY-MM-DD')
};

const jobRunParams = {
    status: [ 'successful', 'failed' ],
    group_by_time: true
};

const topTemplateParams = {
    group_by: 'template',
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
    limit: 10
};

const Clusters = ({ history }) => {
    const [ preflightError, setPreFlightError ] = useState(null);
    const [ barChartData, setBarChartData ] = useState([]);
    const [ lineChartData, setLineChartData ] = useState([]);
    const [ templatesData, setTemplatesData ] = useState([]);
    const [ workflowData, setWorkflowsData ] = useState([]);
    const [ modulesData, setModulesData ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(true);
<<<<<<< HEAD
=======
    const [ firstRender, setFirstRender ] = useState(true);
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41

    const [ orgIds, setOrgIds ] = useState([]);
    const [ clusterIds, setClusterIds ] = useState([]);
    const [ templateIds, setTemplateIds ] = useState([]);
    const [ sortBy, setSortBy ] = useState(null);
    const [ statuses, setStatuses ] = useState([]);
    const [ jobTypes, setJobTypes ] = useState([]);
    const [ quickDateRanges, setQuickDateRanges ] = useState([]);
<<<<<<< HEAD
    const {
        queryParams,
        urlMappedQueryParams,
        setFromToolbar
    } = useQueryParams({ ...clusters.defaultParams });
=======

    const {
        queryParams,
        setJobType,
        setOrg,
        setStatus,
        setCluster,
        setTemplate,
        setSortBy2,
        setQuickDateRange,
        setRootWorkflowsAndJobs,
        setStart_Date,
        setEnd_Date
    } = useQueryParams(initialQueryParams);

    const combinedJobRunParams = {
        ...queryParams,
        ...jobRunParams
    };

    const combinedTemplatesListParams = {
        ...queryParams,
        ...topTemplateParams
    };
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41

    const initialOptionsParams = {
        attributes: jobExplorer.attributes
    };

    const { queryParams: optionsQueryParams } = useQueryParams(
        initialOptionsParams
    );

<<<<<<< HEAD
    const topTemplatesParams = {
        ...queryParams,
        ...topTemplateParams
    };
    useEffect(() => {
=======
    const formattedArray = datum => {
        if (Array.isArray(datum)) {
            return [ ...datum ];
        } else {
            return datum.split();
        }
    };

    const [ filters, setFilters ] = useState({
        status: queryParams.status
            ? formattedArray(queryParams.status)
            : [ 'successful', 'failed' ],
        type: queryParams.job_type
            ? formattedArray(queryParams.job_type)
            : [ 'job', 'workflowjob' ],
        org: queryParams.org_id ? formattedArray(queryParams.org_id) : [],
        cluster: queryParams.cluster_id ? formattedArray(queryParams.cluster_id) : [],
        template: queryParams.template_id ? formattedArray(queryParams.template_id) : [],
        sortby: queryParams.sort_by ? queryParams.sort_by : null,
        startDate: queryParams.start_date ? queryParams.start_date : null,
        endDate: queryParams.end_date ? queryParams.end_date : null,
        date: queryParams.quick_date_range ? queryParams.quick_date_range : 'last_30_days',
        showRootWorkflows: queryParams.only_root_workflows_and_standalone_jobs === 'true' ? true : false
    });

    const onDelete = (type, val) => {
        let filtered;
        Number.isInteger(val) ? (val = parseInt(val)) : val;

        if (type === 'Status') {
            filtered = statuses.filter(status => status.value === val);
        }

        if (type === 'Type') {
            filtered = jobTypes.filter(job => job.value === val);
        }

        if (type === 'Org') {
            filtered = orgIds.filter(org => org.value === val);
        }

        if (type === 'Cluster') {
            filtered = clusterIds.filter(cluster => cluster.value === val);
        }

        if (type === 'Template') {
            filtered = templateIds.filter(template => template.value === val);
        }

        if (type) {
            if (type === 'Date') {
                setFilters({
                    ...filters,
                    date: null,
                    startDate: null,
                    endDate: null
                });
            } else if (type === 'SortBy') {
                setFilters({
                    ...filters,
                    sortby: null
                });
            } else {
                setFilters({
                    ...filters,
                    [type.toLowerCase()]: filters[type.toLowerCase()].filter(
                        value => value !== filtered[0].key.toString()
                    )
                });
            }
        } else {
            setFilters({
                status: [],
                type: [],
                org: [],
                cluster: [],
                template: [],
                sortby: null,
                date: null,
                startDate: null,
                endDate: null,
                showRootWorkflows: false
            });
        }
    };

    useEffect(() => {
        if (firstRender) {
            return;
        }

        if (filters.type) {
            setJobType(filters.type);
        }

        if (filters.status) {
            setStatus(filters.status);
        }

        if (filters.org) {
            setOrg(filters.org);
        }

        if (filters.cluster) {
            setCluster(filters.cluster);
        }

        if (filters.template) {
            setTemplate(filters.template);
        }

        // The filter can change back to null too.
        setSortBy2(filters.sortby);

        setRootWorkflowsAndJobs(filters.showRootWorkflows);

        setQuickDateRange(filters.date);

        if (filters.date !== 'custom') {
            setStart_Date(null);
            setEnd_Date(null);
        } else {
            setStart_Date(filters.startDate);
            setEnd_Date(filters.endDate);
        }
    }, [ filters ]);

    useEffect(() => {
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
        let ignore = false;

        const fetchEndpoints = () => {
            return Promise.all(
                [
<<<<<<< HEAD
                    readJobExplorer({ params: urlMappedQueryParams(queryParams) }),
                    readJobExplorer({ params: urlMappedQueryParams(topTemplatesParams) }),
                    readJobExplorer({ params: urlMappedQueryParams(topWorkflowParams) }),
                    readEventExplorer({ params: urlMappedQueryParams(moduleParams) }),
=======
                    readJobExplorer({ params: combinedJobRunParams }),
                    readJobExplorer({ params: combinedTemplatesListParams }),
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
                    readJobExplorerOptions({ params: optionsQueryParams })
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
<<<<<<< HEAD
                    { items: workflowData = []},
                    { items: modulesData = []},
=======
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
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
<<<<<<< HEAD
                        setModulesData(modulesData);
                        setWorkflowsData(workflowData);
=======
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
                        setClusterIds(cluster_id);
                        setOrgIds(org_id);
                        setTemplateIds(template_id);
                        setSortBy(sort_by);
                        setStatuses(status);
                        setJobTypes(job_type);
                        setQuickDateRanges(quick_date_range);
<<<<<<< HEAD
                        setIsLoading(false);

=======
                        setFirstRender(false);
                        setIsLoading(false);
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
                    }
                }
            );
        }

        initializeWithPreflight();

        return () => (ignore = true);
    }, []);

    // Get and update the data
    useEffect(() => {
<<<<<<< HEAD
        const update = () => {
            readJobExplorer({ params: urlMappedQueryParams(queryParams) }).then(({ items: chartData }) => {
                queryParams.clusterId.length > 0 ? setLineChartData(chartData) : setBarChartData(chartData);
            });
            readJobExplorer({ params: topTemplatesParams }).then(({ items: templatesData }) => {
=======
        setIsLoading(true);
        window.insights.chrome.auth.getUser().then(() =>
            Promise.all([
                readModules({ params: queryParams }),
                readJobExplorer({ params: combinedTemplatesListParams }),
                readJobExplorer({ params: combinedJobRunParams })
            ]).then(([
                { modules: modulesData = []},
                { items: templatesData = []},
                { items: chartData = []}
            ]) => {
                queryParams.cluster_id ? setLineChartData(chartData) : setBarChartData(chartData);
                setModulesData(modulesData);
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
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
<<<<<<< HEAD
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
=======
                <PageHeaderTitle title={ title } />
                <FilterableToolbar
                    orgs={ orgIds }
                    statuses={ statuses }
                    clusters={ clusterIds }
                    templates={ templateIds }
                    types={ jobTypes }
                    sortables={ sortBy }
                    dateRanges={ quickDateRanges }
                    onDelete={ onDelete }
                    passedFilters={ filters }
                    handleFilters={ setFilters }
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
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
<<<<<<< HEAD
                      { queryParams.clusterId.length <= 0 &&
=======
                      { !queryParams.cluster_id &&
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
                  barChartData.length > 0 &&
                  !isLoading && (
                          <BarChart
                              margin={ { top: 20, right: 20, bottom: 50, left: 70 } }
                              id="d3-bar-chart-root"
                              data={ barChartData }
                              value={ barChartData.length }
                          />
                      ) }
<<<<<<< HEAD
                      { queryParams.clusterId.length > 0  &&
=======
                      { queryParams.cluster_id  &&
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
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
<<<<<<< HEAD
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
=======
>>>>>>> b009ce067b10e1c1c8881f0c1e1f6da2ca544a41
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
