import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

// const API_URL = "https://registry.api.identifiers.org/restApi";
// const response = await axios.get(
//   `${API_URL}/namespaces?size=1000&sort=name,asc`
// );

const main = async () => {
  const prefixFilePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "assets",
    "json",
    "prefix.json",
  );

  const prefixData = JSON.parse(fs.readFileSync(prefixFilePath, "utf8"));

  const response = await axios.get(
    `https://registry.api.identifiers.org/restApi/namespaces?size=1000&sort=name,asc`,
  );

  const { namespaces } = response.data._embedded;

  console.log(`Found ${namespaces.length} namespaces`);

  const identifiers = [];

  for (const [index, namespace] of namespaces.entries()) {
    const resourcesURL = namespace._links.resources.href;

    // skip if no resources
    if (!resourcesURL) {
      continue;
    }

    console.log(
      `Fetching resources for namespace ${namespace.name} - ${index + 1} / ${namespaces.length}`,
    );

    // Get the resources
    const resourcesResponse = await axios.get(resourcesURL);

    const { resources } = resourcesResponse.data._embedded;

    // skip if no resources
    if (!resources || resources.length === 0) {
      continue;
    }

    const resourcesData = [];

    for (const resource of resources) {
      const data = {
        name: resource.name,
        deprecated: resource.deprecated,
        description: resource.description,
        official: resource.official,
        protectedUrls: resource.protectedUrls,
        resourceHomeUrl: resource.resourceHomeUrl,
        urlPattern: resource.urlPattern,
      };

      resourcesData.push(data);
    }

    // sort the resources by name
    resourcesData.sort((a, b) => {
      if (a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
      }

      if (a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
      }

      return 0;
    });

    const preExisting = prefixData.find(
      (item: any) => item.value === namespace.prefix,
    );

    const type = preExisting ? preExisting.type : "other";

    const data = {
      deprecated: namespace.deprecated,
      label: namespace.name,
      pattern: namespace.pattern,
      placeholder: namespace.sampleId,
      resources: resourcesData,
      type,
      value: namespace.prefix,
    };

    // replace github with GitHub
    if (data.label === "github") {
      data.label = "GitHub";
    }

    // replace dg.nacd default label with AccessClinicalData@NIAID
    if (data.value === "dg.nacd") {
      data.label = "AccessClinicalData@NIAID";
    }

    identifiers.push(data);
  }

  // add URL identifier manually
  identifiers.push({
    deprecated: false,
    label: "URL",
    pattern: "^https?:\\/\\/.*$",
    placeholder: "https://example.com/123",
    resources: [],
    type: "other",
    value: "url",
  });

  // sort by label
  identifiers.sort((a, b) => {
    if (a.label.toLowerCase() < b.label.toLowerCase()) {
      return -1;
    }

    if (a.label.toLowerCase() > b.label.toLowerCase()) {
      return 1;
    }

    return 0;
  });

  const __filename = fileURLToPath(import.meta.url);

  const __dirname = path.dirname(__filename);

  const filePath = path.join(
    __dirname,
    "..",
    "assets",
    "json",
    "dev",
    "identifiers-org.json",
  );

  // create directory if it doesn't exist
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath));
  }

  fs.writeFileSync(filePath, JSON.stringify(identifiers, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
