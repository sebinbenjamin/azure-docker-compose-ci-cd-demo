## Deploying a docker-compose app to Azure
To deploy a multi-container Docker application to Azure using GitHub Actions, you'll need to set up several components:

- Azure Container Registry (ACR): To store your Docker images.
- Azure Web App for Containers: To run your Docker containers.
- GitHub Actions: To automate the build and deployment process.

### Obtaining the Azure credentials
1. Install the Azure CLI and make sure you've logged in using `az login`. Also make sure you've se the right subscription as default `az account list --output table`

2. Create a Service Principal `az ad sp create-for-rbac --name MyDemoAppServicePrincipal --role Contributor --scopes /subscriptions/{subscription-id} --sdk-auth` . Store the JSON output as the AZURE_CREDENTIALS value in GitHub Secrets

3. Create an Azure Resource group for the app `az group create --name demo-fs-appResources --location australiaeast`

4. Create an Azure Container Registry (ACR) `az acr create --resource-group demo-fs-appResources --name demofsappregistry --sku Basic --location australiaeast`

5. Find the registry login server
`az acr show --name demofsappregistry --query loginServer --output tsv`

6. Enable the repo admin `az acr update -n demofsappregistry --admin-enabled true`

7. Find the registry username & password `az acr credential show --name demofsappregistry --query username --output tsv` and `az acr credential show --name demofsappregistry --query "passwords[0].value" --output tsv`

## Creating the Azure app service plan and Azure web app for container

1. Create an app service plan `az appservice plan create --name myDemoAppPlan --resource-group demo-fs-appResources --sku B1 --is-linux --location australiaeast`

2. Create an Azure Web App for Containers `az webapp create --resource-group demo-fs-appResources --plan myDemoAppPlan --name demo-fs-app --multicontainer-config-type compose --multicontainer-config-file docker-compose.yml
`

## MUST DO: Add ACR Pull Role to Web App's managed identity
1. Enable system-assigned managed identity for the Web app `az webapp identity assign --name demo-fs-app --resource-group demo-fs-appResources`
2. Find the principle ID `az webapp identity show --name demo-fs-app --resource-group demo-fs-appResources --query principalId --output tsv`
3. Find out the ACR resource ID by running `az acr show --name demofsappregistry --query id --output tsv`
4. Use the principle id to Assign the "AcrPull" role to the identity `az role assignment create --assignee <service-principal-appid> --role AcrPull --scope <acr-resource-id>`
4. Use the principle id to Assign the "AcrPull" role to the identity `az role assignment create --assignee e15eb180-07a6-4bfa-83bc-6f223a6f9b58 --role AcrPull --scope /subscriptions/1aae93d0-43fe-4702-9f99-052fba2c240c/resourceGroups/demo-fs-appResources/providers/Microsoft.ContainerRegistry/registries/demofsappregistry`

## For Docker Volumes - Create an Azure Storage Account and File Share
1. Create Azure Storage Account `az storage account create --name demodockerappstorage --resource-group demo-fs-appResources  --location australiaeast --sku Standard_LRS`
2. Grab the account key for use in the next step `az storage account keys list --resource-group demo-fs-appResources --account-name demodockerappstorage --query '[0].value' --output tsv`
3. Create a file share within the storage account `az storage share create --name demoappfileshare --account-name demodockerappstorage --account-key abcd1234`

### Update the settings to allow multiple ports in the container
Run the config command to allow the extra set of ports based on you requirement. For instance, 
```az webapp config appsettings set --resource-group <group-name> --name <app-name> --settings WEBSITES_PORT=80,3001,3306```

### Credential setup in Github Actions Secrets

AZURE_CREDENTIALS: The JSON output from az ad sp create-for-rbac.
REGISTRY_LOGIN_SERVER: The login server of your ACR, e.g., myRegistry.azurecr.io.
REGISTRY_USERNAME: The username for your ACR.
REGISTRY_PASSWORD: The password for your ACR.
AZURE_RESOURCE_GROUP: The name of your Azure resource group.
AZURE_APP_SERVICE_PLAN: The name you want to assign to your Azure App Service plan.
AZURE_WEBAPP_NAME: The name you want to assign to your Azure Web App.
AZURE_LOCATION: The region you want to use (e.g., australiaeast).

### Helpful script to debug
`az webapp log tail --name demo-fs-app --resource-group demo-fs-appResources`
`az webapp log tail --name demo-fs-app --resource-group demo-fs-appResources --provider docker`

az webapp config container set  --name demo-fs-app --resource-group demo-fs-appResources --multicontainer-config-type --settings SOMEENV="somevalue" compose --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=TRUE --multicontainer-config-file docker-compose.yml