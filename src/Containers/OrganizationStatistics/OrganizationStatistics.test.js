/* eslint-disable camelcase */
import { act } from 'react-dom/test-utils';
import {
    mountPage,
    preflight200,
    preflight400
} from '../tests/helpers';
import fetchMock from 'fetch-mock-jest';
import OrganizationStatistics from './OrganizationStatistics';
import { keysToCamel } from '../../Utilities/helpers';

const chartRoots = [
    'd3-grouped-bar-chart-root',
    'd3-donut-1-chart-root',
    'd3-donut-2-chart-root'
];

const jobExplorerUrl = 'path:/api/tower-analytics/v1/job_explorer/';
const dummyOrgData = (size) => ({
    dates: [ ...Array(size).keys() ].map(el => ({
        items: [ ...Array(size).keys() ].map(i => ({
            id: i - 1,
            total_count: i * el,
            name: i === 0 ? '' : 'org name'
        })),
        date: new Date()
    }))
});

const dummyPieData = (size) => ({
    items: [ ...Array(size).keys() ].map(i => ({
        id: i - 1,
        host_count: i * 10,
        name: i === 0 ? '' : 'org name'
    }))
});

const jobExplorerOptionsUrl = 'path:/api/tower-analytics/v1/job_explorer_options/';
const jobExplorerOptions = {
    quick_date_range: [
        { key: 'last_30_days', value: 'Last 30 days' },
        { key: 'last_2_weeks', value: 'Last 2 weeks' },
        { key: 'last_week', value: 'Last week' },
        { key: 'last_72_hours', value: 'Last 72 hours' },
        { key: 'last_24_hours', value: 'Last 24 hours' },
        { key: 'custom', value: 'Custom' }
    ]
};

const defaultQueryParams = {
    groupBy: 'org',
    includeOthers: true,
    quickDateRange: 'last_30_days',
    limit: 5,
    jobType: [ 'workflowjob', 'job' ]
};

const lastCallBody = (url) => keysToCamel(JSON.parse(fetchMock.lastCall(url)[1].body));

describe('Containers/OrganizationStatistics', () => {
    let wrapper;

    beforeEach(() => {
        chartRoots.forEach(item => {
            let d3Container = document.createElement('div');
            d3Container.setAttribute('id', item);
            document.body.appendChild(d3Container);
        });

        fetchMock.get({ ...preflight200 });
        fetchMock.post({
            url: jobExplorerUrl,
            body: { group_by: 'org', group_by_time: true },
            matchPartialBody: true
        }, { ...dummyOrgData(5) });
        fetchMock.post({
            url: jobExplorerUrl,
            body: { group_by: 'org', include_others: true },
            matchPartialBody: true,
            overwriteRoutes: false
        }, { ...dummyPieData(5) });
        fetchMock.post({ url: jobExplorerOptionsUrl }, { ...jobExplorerOptions });
    });

    afterEach(() => {
        chartRoots.forEach(item => {
            let d3Container = document.getElementById(item);
            d3Container.remove();
        });

        fetchMock.restore();
        wrapper = null;
    });

    it('should render without any errors', async () => {
        await act(async () => {
            wrapper = mountPage(OrganizationStatistics);
        });
        wrapper.update();

        expect(wrapper).toBeTruthy();
    });

    it('should render with data', async () => {
        await act(async () => {
            wrapper = mountPage(OrganizationStatistics);
        });
        wrapper.update();

        expect(wrapper.text()).not.toEqual(
            expect.stringContaining('No Data')
        );
        expect(wrapper.text()).not.toEqual(
            expect.stringContaining('Loading')
        );
    });

    it('should render preflight error', async () => {
        fetchMock.get({ ...preflight400, overwriteRoutes: true });
        await act(async () => {
            wrapper = mountPage(OrganizationStatistics);
        });
        wrapper.update();

        expect(wrapper.text()).toEqual(
            expect.stringContaining('Not authorized')
        );
    });

    it('should render api error', async () => {
        fetchMock.post({
            url: jobExplorerUrl,
            overwriteRoutes: true,
            response: { throws: { error: 'General Error' }, status: 400 }
        });

        await act(async () => {
            wrapper = mountPage(OrganizationStatistics);
        });
        wrapper.update();

        expect(wrapper.text()).toEqual(
            expect.stringContaining('General Error')
        );
    });

    it('should render with empty response', async () => {
        fetchMock.post({ url: jobExplorerUrl, overwriteRoutes: true }, {});

        await act(async () => {
            wrapper = mountPage(OrganizationStatistics);
        });
        wrapper.update();

        expect(wrapper.text()).toEqual(
            expect.stringContaining('No Data')
        );
    });

    it('should send the default queryParams', async () => {
        await act(async () => {
            wrapper = mountPage(OrganizationStatistics);
        });
        wrapper.update();

        const { sortBy, ...rest } = lastCallBody(jobExplorerUrl);

        expect(sortBy.split(':')[1]).toBe('desc');
        expect(rest).toEqual(defaultQueryParams);
    });

});
