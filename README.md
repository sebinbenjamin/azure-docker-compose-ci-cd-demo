## Deploying a docker-compose app to Azure
To deploy a multi-container Docker application to Azure using GitHub Actions, you'll need to set up several components:

- **Azure Container Registry (ACR):** To store your Docker images.
- **Azure Container Instances (ACI):** To run your Docker containers. Note: Azure web apps is a different service, which is limited at the moment. It can only expose a single port.
- **GitHub Actions:** To automate the Docker image build and deployment process to ACI.

### Obtaining the Azure credentials
1. Install the Azure CLI and make sure you've logged in using `az login`. Also make sure you've se the right subscription as default `az account list --output table`

2. Create a Service Principal `az ad sp create-for-rbac --name MyDemoAppServicePrincipal --role Contributor --scopes /subscriptions/{subscription-id} --sdk-auth` . Store the JSON output as the AZURE_CREDENTIALS value in GitHub Secrets

3. Create an Azure Resource group for the app `az group create --name demo-fs-appResources --location australiaeast`

4. Create an Azure Container Registry (ACR) `az acr create --resource-group demo-fs-appResources --name demofsappregistry --sku Basic --location australiaeast`

5. Find the registry login server
`az acr show --name demofsappregistry --query loginServer --output tsv`

6. Enable the repo admin `az acr update -n demofsappregistry --admin-enabled true`

7. Find the registry username & password `az acr credential show --name demofsappregistry --query username --output tsv` and `az acr credential show --name demofsappregistry --query "passwords[0].value" --output tsv`

## Create an ACI instance with your Docker Compose configuration

1. az container create --resource-group demo-aci-appResources --name demo-aci-app --image myImage --registry-login-server demoaciappregistry.azurecr.io --registry-username <acr-username> --registry-password <acr-password> --dns-name-label demo-aci-app-dns --ports 80 443
`

## TODO: Add ACR Pull Role to Web App's managed identity
1. Enable system-assigned managed identity for the Web app `az webapp identity assign --name demo-fs-app --resource-group demo-fs-appResources`
2. Find the principle ID `az webapp identity show --name demo-fs-app --resource-group demo-fs-appResources --query principalId --output tsv`
3. Find out the ACR resource ID by running `az acr show --name demofsappregistry --query id --output tsv`
4. Use the principle id to Assign the "AcrPull" role to the identity `az role assignment create --assignee <service-principal-appid> --role AcrPull --scope <acr-resource-id>`
4. Use the principle id to Assign the "AcrPull" role to the identity `az role assignment create --assignee e15eb180-07a6-4bfa-83bc-6f223a6f9b58 --role AcrPull --scope /subscriptions/1aae93d0-43fe-4702-9f99-052fba2c240c/resourceGroups/demo-fs-appResources/providers/Microsoft.ContainerRegistry/registries/demofsappregistry`

## For Docker Volumes - Create an Azure Storage Account and File Share
1. Create Azure Storage Account `az storage account create --name demodockerappstorage --resource-group demo-fs-appResources  --location australiaeast --sku Standard_LRS`
2. Grab the account key for use in the next step `az storage account keys list --resource-group demo-fs-appResources --account-name demodockerappstorage --query '[0].value' --output tsv`
3. Create a file share within the storage account `az storage share create --name demoappfileshare --account-name demodockerappstorage --account-key abcd1234`

### Credential setup in Github Actions Secrets

AZURE_CREDENTIALS: The JSON output from az ad sp create-for-rbac.
REGISTRY_LOGIN_SERVER: The login server of your ACR, e.g., myRegistry.azurecr.io.
REGISTRY_USERNAME: The username for your ACR.
REGISTRY_PASSWORD: The password for your ACR.
AZURE_RESOURCE_GROUP: The name of your Azure resource group.
AZURE_LOCATION: The region you want to use (e.g., australiaeast).
DNS_NAME_LABEL: DNS name label for the ACI deployment, e.g., `demo-aci-app-dns`

### Helpful script to debug
`az container logs --resource-group demo-aci-appResources --name demo-aci-app`
`az container show --resource-group demo-aci-appResources --name demo-aci-app --query 'containers[0].instanceView.events' --output table`

## Cleanup

Delete the Container Instance `az container delete --resource-group demo-aci-appResources --name demo-aci-app --yes`