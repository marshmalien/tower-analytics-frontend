/* eslint-disable camelcase */
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import styled from 'styled-components';
import { stringify } from 'query-string';

import { useQueryParams } from '../../Utilities/useQueryParams';

import LoadingState from '../../Components/LoadingState';
import NoData from '../../Components/NoData';
import EmptyState from '../../Components/EmptyState';
import { preflightRequest, readROI } from '../../Api';
import { Paths } from '../../paths';

import {
    Main,
    PageHeader,
    PageHeaderTitle
} from '@redhat-cloud-services/frontend-components';

import {
    Button,
    Card,
    CardBody as PFCardBody,
    CardTitle as PFCardTitle,
    FormSelect,
    FormSelectOption,
    InputGroup,
    InputGroupText,
    TextInput,
    Title,
    Tooltip,
    Popover
} from '@patternfly/react-core';

import {
    DollarSignIcon,
    FilterIcon,
    InfoCircleIcon
} from '@patternfly/react-icons';

import TopTemplatesSavings from '../../Charts/ROITopTemplates';

import {
    calculateDelta,
    convertSecondsToMins,
    convertMinsToSeconds,
    convertSecondsToHours,
    convertWithCommas,
    formatPercentage
} from '../../Utilities/helpers';

const FilterCardTitle = styled(PFCardTitle)`
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

const defaultAvgRunVal = 3600; // 1 hr in seconds
const defaultCostAutomation = 20;
const defaultCostManual = 50;

const InputAndText = styled.div`
  flex: 1;
`;

const TemplateDetail = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  div,
  em {
    padding-right: 5px;
  }

  @media (max-width: 1490px) {
    display: block;

    em {
      padding: 10px 0;
      display: block;
    }
  }
`;

const TemplateDetailSubTitle = styled.em`
  color: var(--pf-global--Color--dark-200);
`;

const TooltipWrapper = styled.div`
  p {
    text-align: left;
  }
`;

const IconGroup = styled.div`
  & svg {
    fill: var(--pf-global--Color--dark-200);

    :hover {
      cursor: pointer;
    }

    :first-of-type {
      margin-right: 10px;
      margin-left: 10px;

      @media (max-width: 1350px) {
        margin-left: 0;
      }
    }
  }
`;

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 5fr 2fr;
  height: 100%;
`;

const WrapperLeft = styled.div`
  flex: 5;
  display: flex;
  flex-direction: column;
  overflow: auto;
`;

const WrapperRight = styled.div`
  flex: 2;
  display: flex;
  flex-direction: column;
`;

const CardTitle = styled(PFCardTitle)`
  border-bottom: 1px solid #d7d7d7;
  margin-bottom: 10px;
`;

const CardBody = styled(PFCardBody)`
  overflow: auto;
`;

/* helper variables for further date ranges */
const pastYear = moment().subtract(1, 'year');
const pastYTD = moment().startOf('year');
const pastQuarter = moment().startOf('quarter');
const pastMonth = moment().subtract(1, 'month');

/* these are the buckets of time the user's are able to select ... */
const timeFrameOptions = [
    { value: 'please choose', label: 'Select date range', disabled: true },
    { value: pastYear.format('YYYY-MM-DD'), label: 'Past year', disabled: false },
    { value: pastYTD.format('YYYY-MM-DD'), label: 'Past year to date', disabled: false },
    { value: pastQuarter.format('YYYY-MM-DD'), label: 'Past quarter', disabled: false },
    { value: pastMonth.format('YYYY-MM-DD'), label: 'Past month', disabled: false }
];

/* set the default bucket to 365 days */
const initialQueryParams = {
    startDate: pastYear.format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD')
};

// create our array to feed to D3
export const formatData = (response, defaults) => {
    return response.reduce(
        (
            formatted,
            {
                name,
                template_id: id,
                successful_run_count,
                successful_elapsed_sum,
                successful_host_run_count_avg,
                successful_host_run_count,
                elapsed_sum,
                failed_elapsed_sum,
                orgs,
                clusters,
                template_automation_percentage
            }
        ) => {
            formatted.push({
                name,
                id,
                run_count: successful_run_count,
                host_count: successful_host_run_count_avg || 0,
                successful_host_run_count,
                delta: 0,
                isActive: true,
                calculations: [
                    {
                        type: 'Manual',
                        avg_run: defaults.defaultAvgRunVal,
                        cost: 0
                    },
                    {
                        type: 'Automated',
                        avg_run: successful_elapsed_sum || 0,
                        cost: 0
                    }
                ],
                orgs,
                clusters,
                elapsed_sum,
                failed_elapsed_sum,
                successful_elapsed_sum,
                template_automation_percentage
            });
            return formatted;
        },
        []
    );
};

export const updateData = (seconds, id, data) => {
    let updatedData = [ ...data ];
    updatedData.map((datum) => {
        if (datum.id === id) {
            // Update manual calculations
            datum.calculations[0].avg_run = seconds;
            datum.calculations[0].total = seconds * datum.successful_host_run_count;
        }
    });
    return updatedData;
};

export const handleManualTimeChange = (minutes) => {
    const seconds = convertMinsToSeconds(minutes);
    return seconds;
};

export const formatSelectedIds = (arr, id) => {
    let selected;
    if (arr.includes(id)) {
        selected = [ ...arr ].filter((s) => s !== id);
    } else {
        selected = [ ...arr, id ];
    }

    return selected;
};

export const handleToggle = (id, selected) => {
    const currentSelection = [ ...selected ];
    const newSelection = formatSelectedIds(currentSelection, id);
    return newSelection;
};

export const computeTotalSavings = (formattedData, costAutomation, costManual) => {
    let data = [ ...formattedData ];
    let total = 0;
    let costAutomationPerHour;
    let costManualPerHour;

    data.forEach((datum) => {
        costAutomationPerHour =
            convertSecondsToHours(datum.successful_elapsed_sum) * costAutomation;
        costManualPerHour =
            convertSecondsToHours(datum.calculations[0].avg_run) *
            datum.successful_host_run_count *
            costManual;
        total += calculateDelta(costAutomationPerHour, costManualPerHour);
        datum.delta = calculateDelta(costAutomationPerHour, costManualPerHour);
        datum.calculations[0].cost = costManualPerHour;
        datum.calculations[1].cost = costAutomationPerHour;
    });

    return total;
};

export const floatToStringWithCommas = (total) => {
    return total
    .toFixed(2)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const filterDataBySelectedIds = (unfilteredData, selectedIds) => {
    const filteredData = unfilteredData.filter(
        ({ id }) => {
            return !selectedIds.includes(id);
        }
    );
    return filteredData;
};

export const setTemplatesIsActive = (templatesList, selectedIds) => {
    templatesList.map((l) => {
        if (selectedIds.includes(l.id)) {
            l.isActive = false;
        } else {
            l.isActive = true;
        }
    });
    return templatesList;
};

const AutomationCalculator = ({ history }) => {
    const [ isLoading, setIsLoading ] = useState(true);
    const [ costManual, setCostManual ] = useState(defaultCostManual);
    const [ costAutomation, setCostAutomation ] = useState(defaultCostAutomation);
    const [ totalSavings, setTotalSavings ] = useState(0);
    const [ unfilteredData, setUnfilteredData ] = useState([]);
    const [ formattedData, setFormattedData ] = useState([]);
    const [ templatesList, setTemplatesList ] = useState([]);
    const [ selectedIds ] = useState([]);
    const [ preflightError, setPreFlightError ] = useState(null);

    // default to the past year (n - 365 days)
    const [ roiTimeFrame, setRoiTimeFrame ] = useState(timeFrameOptions[1].value);
    const { queryParams, setStartDateAsString } = useQueryParams(
        initialQueryParams
    );

    const handleOnChange = (value) => {
        setStartDateAsString(value);
        setRoiTimeFrame(value);
    };

    useEffect(() => {
        insights.chrome.appNavClick({ id: 'automation-calculator', secondaryNav: true });
    }, []);

    useEffect(() => {
        const total = computeTotalSavings(formattedData, costAutomation, costManual);
        const totalWithCommas = floatToStringWithCommas(total);
        setTotalSavings('$' + totalWithCommas);
    }, [ formattedData, costAutomation, costManual ]);

    useEffect(() => {
        const filteredData = filterDataBySelectedIds(unfilteredData, selectedIds);
        setTemplatesIsActive(templatesList, selectedIds);
        setFormattedData(filteredData);
    }, [ selectedIds ]);

    useEffect(() => {
        let ignore = false;
        const getData = () => {
            const result = readROI({ params: queryParams }).catch(() => []);
            return result;
        };

        async function initializeWithPreflight() {
            setIsLoading(true);
            await window.insights.chrome.auth.getUser();
            await preflightRequest().catch((error) => {
                setPreFlightError({ preflightError: error });
            });
            getData().then(({ templates: roiData = []}) => {
                if (!ignore) {
                    const formatted = formatData(roiData, {
                        defaultAvgRunVal,
                        defaultCostAutomation,
                        defaultCostManual
                    });
                    setUnfilteredData(formatted);
                    setFormattedData(formatted);
                    setTemplatesList(formatted);
                    setIsLoading(false);
                }
            });
        }

        initializeWithPreflight();
        return () => (ignore = true);
    }, [ queryParams ]);

    const redirectToJobExplorer = (templateId) => {
        const { jobExplorer } = Paths;
        const initialQueryParams = {
            templateId: [ templateId ],
            status: [ 'successful' ],
            jobType: [ 'job' ],
            quickDateRange: 'last_30_days'
        };

        const search = stringify(initialQueryParams, { arrayFormat: 'bracket' });
        history.push({
            pathname: jobExplorer,
            search
        });
    };

    return (
    <>
      <PageHeader style={ { flex: '0' } }>
          <PageHeaderTitle title={ 'Automation Calculator' } />
      </PageHeader>
      { preflightError && (
          <Main>
              <Card>
                  <CardBody>
                      <EmptyState { ...preflightError } />
                  </CardBody>
              </Card>
          </Main>
      ) }
      { !preflightError && (
        <>
          <Main style={ { paddingBottom: '0' } }>
              <Card>
                  <FilterCardTitle style={ { paddingBottom: '0', paddingTop: '0' } }>
                      <h2>
                          <FilterIcon style={ { marginRight: '10px' } } />
                  Filter
                      </h2>
                      <div style={ { display: 'flex', justifyContent: 'flex-end' } }>
                          <FormSelect
                              name="roiTimeFrame"
                              value={ roiTimeFrame }
                              onChange={ handleOnChange }
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
                  </FilterCardTitle>
              </Card>
          </Main>
          <Wrapper className="automation-wrapper">
              <WrapperLeft>
                  <Main style={ { paddingBottom: '0' } }>
                      <Card>
                          <CardTitle>Automation savings</CardTitle>
                          <PFCardBody>
                              { isLoading && !preflightError && <LoadingState /> }
                              { !isLoading && formattedData.length <= 0 && <NoData /> }
                              { formattedData.length > 0 && !isLoading && (
                      <>
                        <TopTemplatesSavings
                            margin={ { top: 20, right: 20, bottom: 20, left: 70 } }
                            id="d3-roi-chart-root"
                            data={ formattedData }
                            selected={ selectedIds }
                        />
                        <p style={ { textAlign: 'center' } }>Templates</p>
                      </>
                              ) }
                          </PFCardBody>
                      </Card>
                  </Main>
                  <Main style={ { height: 0 } }>
                      <Card style={ { height: '100%' } }>
                          <CardTitle>Automation formula</CardTitle>
                          <CardBody>
                              <p>
                                  <b>Manual cost for template x</b> =
                                  <em>
                        (time for a manual run on one host * (sum of all hosts
                        across all job runs) ) * cost per hour
                                  </em>
                              </p>
                              <p>
                                  <b>Automation cost for template x</b> =
                                  <em>
                        cost of automation per hour * sum of total elapsed hours
                        for a template
                                  </em>
                              </p>
                              <p>
                                  <b>Savings</b> =
                                  <em>
                        Sum of (manual cost - automation cost) across all
                        templates
                                  </em>
                              </p>
                          </CardBody>
                      </Card>
                  </Main>
              </WrapperLeft>
              <WrapperRight>
                  <Main style={ { paddingBottom: '0', paddingLeft: '0' } }>
                      <Card>
                          <PFCardTitle style={ { paddingBottom: '0', borderTop: '3px solid #2B9AF3' } }>
                    Total savings
                          </PFCardTitle>
                          <PFCardBody>
                              <Title
                                  headingLevel="h3"
                                  style={ { color: 'var(--pf-global--success-color--200)', fontSize: '2.5em' } }
                              >
                                  { totalSavings }
                              </Title>
                          </PFCardBody>
                      </Card>
                  </Main>
                  <Main
                      style={ {
                          paddingLeft: '0',
                          display: 'flex',
                          flexDirection: 'column',
                          flex: '1 1 0'
                      } }
                  >
                      <Card style={ { height: '100%' } }>
                          <CardTitle style={ { paddingBottom: '10px' } }>
                    Calculate your automation
                          </CardTitle>
                          <CardBody style={ { flex: '1 1 0' } }>
                              <InputAndText>
                                  <p>Manual cost of automation</p>
                                  <em
                                      style={ { color: 'var(--pf-global--Color--dark-200)' } }
                                  >
                        (e.g. average salary of mid-level Software Engineer)

                                  </em>
                                  <InputGroup style={ { width: '50%', marginTop: '10px' } }>
                                      <InputGroupText>
                                          <DollarSignIcon />
                                      </InputGroupText>
                                      <TextInput
                                          id="manual-cost"
                                          type="number"
                                          step="any"
                                          min="0"
                                          aria-label="manual-cost"
                                          value={ parseFloat(costManual) }
                                          onChange={ (e) => setCostManual(e) }
                                      />
                                      <InputGroupText>/hr</InputGroupText>
                                  </InputGroup>
                              </InputAndText>
                              <InputAndText style={ { paddingTop: '10px' } }>
                                  <p>Automated process cost</p>
                                  <InputGroup style={ { width: '50%' } }>
                                      <InputGroupText>
                                          <DollarSignIcon />
                                      </InputGroupText>
                                      <TextInput
                                          id="automation-cost"
                                          type="number"
                                          step="any"
                                          min="0"
                                          aria-label="automation-cost"
                                          value={ parseFloat(costAutomation) }
                                          onChange={ (e) => setCostAutomation(e) }
                                      />
                                      <InputGroupText>/hr</InputGroupText>
                                  </InputGroup>
                              </InputAndText>
                              <p style={ { marginTop: 15 } }>
                      Enter the time it takes to run the following templates manually.
                              </p>
                              { templatesList.map((data) => (
                                  <div key={ data.id }>
                                      <Tooltip content={ 'Click for list of jobs in the past month' } >
                                          <Button
                                              style={ { padding: '15px 0 10px' } }
                                              component="a"
                                              onClick={ () => redirectToJobExplorer(data.id) }
                                              variant="link"
                                          >
                                              { data.name }
                                          </Button>
                                      </Tooltip>
                                      <TemplateDetail>
                                          <InputAndText key={ data.id }>
                                              <InputGroup>
                                                  <TextInput
                                                      id={ data.id }
                                                      type="number"
                                                      aria-label="time run manually"
                                                      value={ convertSecondsToMins(
                                                          data.calculations[0].avg_run
                                                      ) }
                                                      onChange={ (e) => {
                                                          const seconds = handleManualTimeChange(e);
                                                          const updated = updateData(
                                                              seconds,
                                                              data.id,
                                                              formattedData
                                                          );
                                                          setFormattedData(updated);
                                                      } }
                                                      isDisabled={ !data.isActive }
                                                  />
                                                  <InputGroupText>min</InputGroupText>
                                              </InputGroup>
                                          </InputAndText>
                                          <TemplateDetailSubTitle>
                            x { data.run_count } runs, { data.host_count } hosts
                                          </TemplateDetailSubTitle>
                                          <IconGroup>
                                              <Popover
                                                  aria-label="template detail popover"
                                                  position="left"
                                                  bodyContent={
                                                      <TooltipWrapper>
                                                          <p>
                                                              <b>Total elapsed sum</b>:{ ' ' }
                                                              { data.elapsed_sum.toFixed(2) }s
                                                          </p>
                                                          <p>
                                                              <b>Success elapsed sum</b>:{ ' ' }
                                                              { data.successful_elapsed_sum.toFixed(2) }s
                                                          </p>
                                                          <p>
                                                              <b>Failed elapsed sum</b>:{ ' ' }
                                                              { data.failed_elapsed_sum.toFixed(2) }s
                                                          </p>
                                                          <p>
                                                              <b>Automation percentage</b>:{ ' ' }
                                                              { formatPercentage(
                                                                  data.template_automation_percentage.toFixed(
                                                                      2
                                                                  )
                                                              ) }
                                                          </p>
                                                          <p>
                                                              <b>Associated organizations</b>:{ ' ' }
                                                              <span key={ data.id }>
                                                                  { convertWithCommas(data.orgs, 'org_name') }
                                                              </span>
                                                          </p>
                                                          <p>
                                                              <b>Associated clusters</b>:{ ' ' }
                                                              <span key={ data.id }>
                                                                  { convertWithCommas(
                                                                      data.clusters,
                                                                      'cluster_name'
                                                                  ) }
                                                              </span>
                                                          </p>
                                                      </TooltipWrapper>
                                                  }
                                              >
                                                  <InfoCircleIcon />
                                              </Popover>
                                          </IconGroup>
                                      </TemplateDetail>
                                      <p style={ { color: '#486B00' } }>
                          ${ data.delta.toFixed(2) }
                                      </p>
                                  </div>
                              )) }
                          </CardBody>
                      </Card>
                  </Main>
              </WrapperRight>
          </Wrapper>
        </>
      ) }
    </>
    );
};

export default AutomationCalculator;
