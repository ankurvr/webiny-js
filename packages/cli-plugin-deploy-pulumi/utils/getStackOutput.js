const execa = require("execa");
const mapStackOutput = require("./mapStackOutput");
const { getProject } = require("@webiny/cli/utils");

const getOutputJson = async (stack, env) => {
    const project = getProject();
    try {
        const { stdout } = await execa(
            "yarn",
            ["webiny", "output", stack, "--env", env, "--json", "--no-debug"].filter(Boolean),
            {
                cwd: project.root
            }
        );

        // Let's get the output after the first line break. Everything before is just yarn stuff.
        const extractedJSON = stdout.substring(stdout.indexOf("{"));
        return JSON.parse(extractedJSON);
    } catch (e) {
        return null;
    }
};

module.exports = async (app, env, map) => {
    if (!app) {
        throw new Error(`Please specify a project application folder, for example "apps/admin".`);
    }

    if (!env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    const output = await getOutputJson(app, env);
    if (!output) {
        return output;
    }

    if (!map) {
        return output;
    }

    return mapStackOutput(output, map);
};
