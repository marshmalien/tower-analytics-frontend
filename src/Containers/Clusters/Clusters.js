import React, { useState, useEffect } from 'react';
import moment from 'moment';

import { useQueryParams } from '../../Utilities/useQueryParams';
import useApi from '../../Utilities/useApi';

import styled from 'styled-components';
import LoadingState from '../../Components/LoadingState';
import EmptyState from '../../Components/EmptyState';
import {
    preflightRequest,
    readChart30,
    readClusters,
    readModules,
    readTemplates
} from '../../Api';

import {
    Main,
    PageHeader,
    PageHeaderTitle
} from '@redhat-cloud-services/frontend-components';

import {
    Card,
    CardBody,
    CardTitle as PFCardTitle,
    FormSelect,
    FormSelectOption
} from '@patternfly/react-core';

import { FilterIcon } from '@patternfly/react-icons';

import BarChart from '../../Charts/BarChart';
import LineChart from '../../Charts/LineChart';
import ModulesList from '../../Components/ModulesList';
import TemplatesList from '../../Components/TemplatesList';

const CardTitle = styled(PFCardTitle)`
  border-bottom: 2px solid #ebebeb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &&& {
    min-height: 60px;
    --pf-c-card--first-child--PaddingTop: 10px;
    --pf-c-card__header--not-last-child--PaddingBottom: 10px;

    h3 {
      font-size: 0.875em;
    }
  }
`;

const timeFrameOptions = [
    { value: 'please choose', label: 'Select date range', disabled: true },
    { value: 7, label: 'Past week', disabled: false },
    { value: 14, label: 'Past 2 weeks', disabled: false },
    { value: 31, label: 'Past month', disabled: false }
];

const clusterOptionsMapper = ({ templates: data }) => {
    const defaultClusterOptions = [
        { value: 'please choose', label: 'Select cluster', disabled: true },
        { value: 'all', label: 'All clusters', disabled: false }
    ];
    return data.reduce(
        (formatted, { label, clusterId: id, installUuid: uuid }) => {
            if (label.length === 0) {
                formatted.push({ value: id, label: uuid, disabled: false });
            } else {
                formatted.push({ value: id, label, disabled: false });
            }

            return formatted;
        },
        defaultClusterOptions
    );
};

const chartMapper = ({ data = []}) => data;
const modulesMapper = ({ modules = []}) => modules;
const templatesMapper = ({ templates = []}) => templates;

const initialQueryParams = {
    startDate: moment()
    .subtract(1, 'month')
    .format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
};

const Clusters = ({ history }) => {
    const [ preflightError, setPreFlightError ] = useState(null);
    const [ chartData, loadChartData ] = useApi([], chartMapper);
    const [ templatesData, loadTemplatesData ] = useApi([], templatesMapper);
    const [ modulesData, loadModulesData ] = useApi([], modulesMapper);
    const [ clusterOptions, loadClusterOptions ] = useApi([], clusterOptionsMapper);

    const [ clusterTimeFrame, setClusterTimeFrame ] = useState(31);
    const [ selectedCluster, setSelectedCluster ] = useState('all');
    const { queryParams, setEndDate, setStartDate, setId } = useQueryParams(
        initialQueryParams
    );

    useEffect(() => {
        insights.chrome.appNavClick({ id: 'clusters', secondaryNav: true });

        window.insights.chrome.auth.getUser().then(() =>
            preflightRequest().catch((error) => {
                setPreFlightError({ preflightError: error });
            }).then(() => {
                loadClusterOptions(readClusters());
            })
        );

    }, []);

    // Get and update the data
    useEffect(() => {
        loadChartData(readChart30({ params: queryParams }));
        loadModulesData(readModules({ params: queryParams }));
        loadTemplatesData(readTemplates({ params: queryParams }));
    }, [ queryParams ]);

    const displayChart = () => {
        if (chartData.isLoading) {
            return <LoadingState />;
        } else if (chartData.data.length > 0) {
            if (queryParams.id) {
                return <LineChart
                    margin={ { top: 20, right: 20, bottom: 50, left: 70 } }
                    id="d3-line-chart-root"
                    data={ chartData.data }
                    value={ clusterTimeFrame }
                    clusterId={ queryParams.id }
                />;
            } else {
                return <BarChart
                    margin={ { top: 20, right: 20, bottom: 50, left: 70 } }
                    id="d3-bar-chart-root"
                    data={ chartData.data }
                    value={ clusterTimeFrame }
                />;
            }
        }
    };

    return (
        <React.Fragment>
            <PageHeader>
                <PageHeaderTitle title={ 'Clusters' } />
            </PageHeader>
            { preflightError && (
                <Main>
                    <EmptyState { ...preflightError } />
                </Main>
            ) }
            { !preflightError && (
                <React.Fragment>
                    <Main style={ { paddingBottom: '0' } }>
                        <Card>
                            <CardTitle style={ { paddingBottom: '0', paddingTop: '0' } }>
                                <h2>
                                    <FilterIcon style={ { marginRight: '10px' } } />
                                    Filter
                                </h2>
                                <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
                                    <FormSelect
                                        name="selectedCluster"
                                        value={ selectedCluster }
                                        onChange={ value => {
                                            setSelectedCluster(value);
                                            setId(value);
                                        } }
                                        aria-label="Select Cluster"
                                        style={ { margin: '2px 10px' } }
                                    >
                                        { clusterOptions.data.map(({ value, label, disabled }, index) => (
                                            <FormSelectOption
                                                isDisabled={ disabled }
                                                key={ index }
                                                value={ value }
                                                label={ label }
                                            />
                                        )) }
                                    </FormSelect>
                                    <FormSelect
                                        name="clusterTimeFrame"
                                        value={ clusterTimeFrame }
                                        onChange={ value => {
                                            setClusterTimeFrame(+value);
                                            setEndDate();
                                            setStartDate(+value);
                                        } }
                                        aria-label="Select Date Range"
                                        style={ { margin: '2px 10px' } }
                                    >
                                        { timeFrameOptions.map((option, index) => (
                                            <FormSelectOption
                                                isDisabled={ option.disabled }
                                                key={ index }
                                                value={ option.value }
                                                label={ option.label }
                                            />
                                        )) }
                                    </FormSelect>
                                </div>
                            </CardTitle>
                        </Card>
                    </Main>
                    <Main>
                        <Card>
                            <PFCardTitle>
                                <h2>Job status</h2>
                            </PFCardTitle>
                            <CardBody>
                                { displayChart() }
                            </CardBody>
                        </Card>
                        <div
                            className="dataCard"
                            style={ { display: 'flex', marginTop: '20px' } }
                        >
                            <TemplatesList
                                history={ history }
                                queryParams={ queryParams }
                                clusterId={ queryParams.id }
                                templates={ templatesData.data.slice(0, 10) }
                                isLoading={ templatesData.isLoading }
                            />
                            <ModulesList
                                modules={ modulesData.data.slice(0, 10) }
                                isLoading={ modulesData.isLoading }
                            />
                        </div>
                    </Main>
                </React.Fragment>
            ) }
        </React.Fragment>
    );
};

export default Clusters;
