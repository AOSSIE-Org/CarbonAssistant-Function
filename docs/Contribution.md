### Adding Environment Variable

Select the settings option in your forked repository.

Under settings select the `CI/CD` option.

Now expand the `variables` setting and add environment variables:-
- Enter the key name as `ACCESS_KEY` and for its value `<insert-your-carbonfootprint-key>`
- Enter the key name as `ENDPOINT` and for its value enter, `https://www.carbonhub.org/v1`
- Now you can save your environment variables.

### Running the local test setup

Go to the functions directory and run `npm install`. This will install the required test packages.

In the root directory run the command `npm test` or `bst test` to run all the test suites from the test folder.

To run a specific test suite you can run the command `bst test test/unit/<test-suites-name>` (for e.g. `bst test test/unit/land.test.yml` will specifically run the land intent's test suite)

You can check the logs of the test-scripts in `test_output/report/jest-results.json`


References and How to report bugs
----
- Detailed documentation of the bespoken framework is [here](https://read.bespoken.io/unit-testing/guide-google/#overview)
- Actions on Google docs: https://developers.google.com/actions/
- If you find any issues, please open a bug here on Gitlab.