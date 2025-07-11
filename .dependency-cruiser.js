const config = {
  forbidden: [
    {
      name: 'no-unreachable-from-root',
      severity: 'error',
      from: {
        path: 'src/app/.*\\.tsx?$',
      },
      to: {
        path: 'src',
        pathNot: 'src/app',
        reachable: false,
      },
    },
  ],
  options: {
    tsConfig: {},
    tsPreCompilationDeps: true,
    doNotFollow: {
      path: 'node_modules',
    },
  },
};

export default config;
