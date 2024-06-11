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

### Credential setup in Github Actions Secrets

AZURE_CREDENTIALS: The JSON output from az ad sp create-for-rbac.
REGISTRY_LOGIN_SERVER: The login server of your ACR, e.g., myRegistry.azurecr.io.
REGISTRY_USERNAME: The username for your ACR.
REGISTRY_PASSWORD: The password for your ACR.
AZURE_RESOURCE_GROUP: The name of your Azure resource group.
AZURE_APP_SERVICE_PLAN: The name you want to assign to your Azure App Service plan.
AZURE_WEBAPP_NAME: The name you want to assign to your Azure Web App.
AZURE_LOCATION: The region you want to use (e.g., australiaeast).