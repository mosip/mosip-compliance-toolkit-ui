[![Maven Package upon a push](https://github.com/mosip/mosip-compliance-toolkit-ui/actions/workflows/push-trigger.yml/badge.svg?branch=master)](https://github.com/mosip/mosip-compliance-toolkit-ui/actions/workflows/push-trigger.yml)

# Compliance-Toolkit Portal

This repository contains the UI code for MOSIP compliance toolkit. For an overview refer [here](https://docs.mosip.io/compliance-tool-kit). 

## Build &amp; Deployment Guide

The code is written in Angular JS. 
  
- Install node.js – To build the angular code using angular cli that runs on node. 
  We recommend Node: 14.17.3, Package Manager: npm 6.14.13
  
- Install angular cli – To install angular cli for building the code into deployable artifacts. Follow the following steps to install angular cli on your system.
  - <code>npm install -g @angular/cli</code> (to install angular cli)
  - <code>ng --version</code> (to verify angular is installed in system)
  We recommend Angular CLI: 13.3.2
  
- Check out the source code from GIT – To download the source code from git. Follow the following steps to download source code on your system.
  - <code>git clone https://github.com/mosip/mosip-compliance-toolkit-ui.git</code> (to clone the source code repository from git)

### For Production build:

- Build the code – Follow the following steps to build the source code on your system.
  - Navigate to the mosip-compliance-toolkit-ui directory inside the cloned repository. Then run the following command in that directory
  - <code>ng build "--prod" "--base-href" "." "--output-path=dist" </code>(to build the code)

- Build Docker Image – Follow the following steps to build docker image on your system.
  - <code>docker build -t name . </code>(to build the docker image, replace <code>name</code> with the name of the image you want, &quot;.&quot; Signifies the current directory from where the docker file has to be read.
  - Example: <code>docker build -t toolkitui .</code>
- Run the docker image – Follow the following steps to build docker image on your system.
  - <code>docker run –d –p 80:80 --name container-name image-name</code> (to run the docker image created with the previous step,-d signifies to run the container in detached mode, -p signifies the port mapping left side of the&quot;:&quot; is the external port that will be exposed to the outside world and right side is the internal port of the container that is mapped with the external port. Replace <code>container-name</code> with the name of your choice for the container, replace <code>image-name</code> with the name of the image specified in .the previous step)
  - Example: <code>docker run -d -p 8080:8080 --name nginx toolkitui</code>
- Now you can access the user interface over the internet via browser.
  - Example: <code>http://localhost:8080</code>
  
### For Local build:
- Build & deploy the code locally – Follow the following steps to build the source code on your system.
  - Navigate to the mosip-compliance-toolkit-ui directory inside the cloned repository. Then run the following command in that directory
  - <code>ng serve</code>
- Now you can access the user interface via browser.
  - Example: <code>http://localhost:4200</code>
- But this will give you CORS issue in accessing backend toolkit services. To get around the CORS issue, angular CLI proxy can be used.
  - Update the API services BASE_URL in config.json
  ```
  {  
	"BASE_URL": "https://localhost:4200/proxyapi/",    
	"toolkitUiUrl": "/toolkit-ui/"
	}
  ```
  - Create a new file named proxy.conf.json. Replace ${servicesUrl} with correct url.
  ```
  {
    "/proxyapi": {
      "target": ${servicesUrl},
      "secure": true,
      "changeOrigin": true,
      "pathRewrite": {
        "^/proxyapi": ""
      }
    }    
  }
  ```
  - Now start the server by typing <code>ng serve --proxy-config proxy.conf.json</code>
  - Open the browser, load the app with <code>https://localhost:4200</code>

## Installing in k8s cluster using helm
### Pre-requisites
1. Set the kube config file of the Mosip cluster having dependent services.
1. Below are the dependent services required for compliance toolkit service:
    | Chart | Chart version |
    |---|---|
    |[Clamav](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/external/antivirus/clamav) | 2.4.1 |
    |[Keycloak](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/external/iam) | 7.1.18 |
    |[Keycloak-init](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/external/iam) | 12.0.1-beta |
    |[Postgres](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/external/postgres) | 10.16.2 |
    |[Postgres Init](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/external/postgres) | 12.0.1-beta |
    |[Minio](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/external/object-store) | 10.1.6 |
    |[Config-server](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/mosip/config-server) | 12.0.1-beta |
    |[Artifactory server](https://github.com/mosip/mosip-infra/tree/v1.2.0.1-B1/deployment/v3/mosip/artifactory) | 12.0.1-beta |
    |[Auditmanager service](https://github.com/mosip/mosip-infra/blob/v1.2.0.1-B1/deployment/v3/mosip/kernel/install.sh) | 12.0.1-beta |
    |[Authmanager service](https://github.com/mosip/mosip-infra/blob/v1.2.0.1-B1/deployment/v3/mosip/kernel/install.sh) | 12.0.1-beta |
    |[Keymanager service](https://github.com/mosip/mosip-infra/blob/v1.2.0.1-B1/deployment/v3/mosip/kernel/install.sh) | 12.0.1-beta |
    |[Notifier service](https://github.com/mosip/mosip-infra/blob/v1.2.0.1-B1/deployment/v3/mosip/kernel/install.sh) | 12.0.1-beta |
    |[Partner manager service](https://github.com/mosip/mosip-infra/blob/v1.2.0.1-B1/deployment/v3/mosip/pms/install.sh) | 12.0.1-beta |
    |[Complaince service](https://github.com/mosip/mosip-compliance-toolkit/blob/v0.9/README.md) | 0.9.0 |
### Install
Install `kubectl` and `helm` utilities, then run:
```
cd helm
./install.sh [cluster-kubeconfig-file]
```
### Restart
```
cd helm
./restart.sh [cluster-kubeconfig-file]
```
### Delete
```
cd helm
./delete.sh [cluster-kubeconfig-file]
```
