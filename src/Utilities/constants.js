/* eslint-disable camelcase */
export const jobExplorer = {
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
    defaultParams: {
        status: [ 'successful', 'failed' ],
        quickDateRange: 'last_30_days',
        jobType: [ 'workflowjob', 'job' ],
        orgId: [],
        clusterId: [],
        templateId: [],
        sortBy: 'created:desc',
        startDate: '',
        endDate: '',
        onlyRootWorkflowsAndStandaloneJobs: false,
        limit: 5
    }
};

export const roi = {
    defaultParams: {
        status: [ 'successful' ],
        quickDateRange: 'last_30_days',
        jobType: [ 'job' ],
        sortBy: 'host_count:desc',
        onlyRootWorkflowsAndStandaloneJobs: true,
        limit: 5,
        attributes: [
            'elapsed',
            'host_count',
            'host_task_count',
            'total_org_count',
            'total_cluster_count'
        ]
    }
};
