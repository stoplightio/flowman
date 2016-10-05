const buildCases = () => {
  return [
    {
      name: 'empty object',
      collection: {},
      flow: {},
    },
    {
      name: 'empty array',
      collection: [{}],
      flow: [{}],
    },
  ];
};

const cases = buildCases();

export default cases;
