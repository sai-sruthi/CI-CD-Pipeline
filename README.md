# DEVOPS

The CI-CD Pipeline performs the following milestones: 

* https://github.com/CSC-DevOps/Course/blob/master/Project/Pipeline1.md
* https://github.com/CSC-DevOps/Course/blob/master/Project/Pipeline2.md
* https://github.com/CSC-DevOps/Course/blob/master/Project/Pipeline3.md

## How to run 
Git clone the project library 

$ ` git clone https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-02.git`

$ `cd DEVOPS-02`

$ `npm install`

## Pipeline Commands 

#### Configure jenkins and the build environment 

The command below performs the below mentioned tasks in sequential order: 

- Automatically configure a build server (config-srv) with jenkins and ansible.
- Automatically configure a build environment for a node web application (checkbox.io)
- Create a build job

$ `pipeline setup`

#### Trigger a build job (named checkbox.io), wait for output, and print the build log.

The command below will trigger the build job, can be seen in the browser: http://192.168.33.20:9000/

$ `pipeline build checkbox.io -u <admin> -p <admin>`

![image1](https://media.github.ncsu.edu/user/16063/files/05d49780-89b0-11eb-875d-7a06442f5b02)

## Setup

As part of the setup command:
- The .vault-pass files are copied to the home directory of the VM.

## Challenges

- Identifying the right jenkins plugins for checkbox.io build job 
- While installing jenkins plugins we faced installation timeouts
- The duration of ansible install resulted in long setup runs
- Python upgrade forced us to change ansible install approach
- Handling asynchronous events in ansible playbook tasks such as jenkins restarts, plugin installs, http requests
- jenkins-job-builder did not support clear text password in jenkins.ini file. It required api token to be generated

## Screencast

* Below is the link demonstrating running of code for the Milestone 1

    [Milestone 1](https://drive.google.com/file/d/1YqYwKel_IS_74SSFIRiGx5_AUXrJ4vMx/view?usp=sharing)


<hr/>

# Milestone 2 - Test 

The commands below perform the tasks mentioned after that in sequential order: 

### Setup-Command
$ `pipeline setup --gh-user <username> --gh-pass <password>`

- Create a build environment and a build job for the iTrust application : 
   * Brings up the config-srv vm with focal image and 4GB memory.
   * Installs Ansible, Mysql, Maven, Java, Jenkins (with necessary plugins).
   * Creates the Jenkins credential with the username and password entered in the CLI.
   * Creates a build job based on the pipeline in the jenkins-build-job.yml file.

Created Jenkins Credentials for accessing GitHub Repo:
![Build_iTrust__Jenkins_0](https://media.github.ncsu.edu/user/6557/files/0d162f00-9a9e-11eb-901e-20aa48ad7b94)

Created Checkbox.io and iTrust build jobs:
![Build_iTrust__Jenkins_0a](https://media.github.ncsu.edu/user/6557/files/24a9e380-9aaf-11eb-879f-5416667baafb)


### Build-Command
$ `pipeline build iTrust -u <admin> -p <admin>`

- Kickstarts the iTrust build job which performs the following tasks : 
   * Clones the iTrust repo and updates application.yml and runs mvn test command.
   * Runs Checkstyle and Jacoco coverage tests and gates the build in case of threshold violations.
   * Cleans up the directory, database and kills google chrome and stray processes running on port 9001.


iTrust build job successfully completed the build stages:
![Build_iTrust__Jenkins_1](https://media.github.ncsu.edu/user/6557/files/0d162f00-9a9e-11eb-8b90-53bd7ca6fb4f)

Checkstyle and Jacoco coverage summary:
![Build_iTrust__Jenkins_2](https://media.github.ncsu.edu/user/6557/files/0daec580-9a9e-11eb-9a4f-e280e31bff53)



$ `pipeline useful-tests -c 1000 --gh-user <username> --gh-pass <password>`

The command is to be provided with an github username and password for ncsu github. 

- Implement a test suite analysis for detecting useful tests : 
   * Generate random changes with your code fuzzer.
   * If your changes would result in compile failures, discard changes and restart process.
   * Run units tests with mvn clean test.
   * Record which test cases have failed, and which have passed.
   * Reset code, drop database, discarding your changes. 

The following image shows the output for 1000 test suite runs

![TestSuite1000](https://media.github.ncsu.edu/user/16063/files/df88b000-9ab4-11eb-824e-742a77af3499)

The output of the test suite run can be seen in the file names count.json

## Challenges
- Configuring the build environment particularly Mysql for the iTrust application was initially difficult. 
- Parsing through the job's console log to identify root cause of build failures was challenging.
- Configuring the MySql Username and password for iTrust application
- Reclowning the iTrust application in the VM, as mutation of test cases was not possible for the folder present in the jenkins buil job 
- Generating output for 1000 runs of test suite took almost 14hours of run time  

## Screencast

* Below are the links demonstrating running of code for the Milestone 2 

    [Milestone 2](https://drive.google.com/file/d/1GD4ajQgkBIHXeNcWFKa7_hUuaNFdJH-v/view?usp=sharing)

<hr/>

# Milestone 3 - Deploy

## General Tasks
   * Provision cloud instances and setup monitoring infrastructure.
   * Implement deployment to cloud instances.
   * Implement canary analysis (checkbox.io preview microservice)

The node.js project supports the following commands:

```bash
# Provision cloud instances
$ pipeline prod up
<output inventory.ini with production assets>

# Perform a deployment of checkbox.io with given inventory
$ pipeline deploy checkbox.io -i inventory.ini

# Trigger a build job (named iTrust), wait for output, and print build log.
# Extend your jenkins build job to create a war file for deployment.
$ pipeline build iTrust -u <admin> -p <admin>

# Perform a deployment of iTrust with given inventory
$ pipeline deploy iTrust -i inventory.ini

# Construct canary infrastructure, collect data, and perform analysis on the given branches.
$ pipeline canary master broken
<report and canary score and whether passed or failed>
...
```

### Provision cloud instances

To provision to the cloud instance we used DIGITAL OCEAN, hence it is required to set the environment variable named DIGITAL_OCEAN_API_KEY using your API Key before performing the deploy command. 

The following image shows login to the remote from config-srv 

![provisionserver](https://media.github.ncsu.edu/user/16063/files/00979600-ad2d-11eb-8c96-7c7f285f593d)

### Deploy checkbox.io and iTrust

The following images show the tasks being run as a part of iTrust Deploy: 

![iTrustDeployment](https://media.github.ncsu.edu/user/15271/files/4c0b3380-aae4-11eb-9932-80bca6a0a472)

![iTrustDeployment2](https://media.github.ncsu.edu/user/15271/files/2f6efb80-aae4-11eb-88b2-5426112ae3e3)

![iTrust-tomcat-manager](https://media.github.ncsu.edu/user/15271/files/6fce7980-aae4-11eb-9e95-af8d886c34a3)

The following images show the tasks being run as a part of checkbox.io Deploy: 

![checkbox1](https://media.github.ncsu.edu/user/15271/files/7c9cd880-ad43-11eb-8929-7fc5abc75529)

![checkbox2](https://media.github.ncsu.edu/user/15271/files/89b9c780-ad43-11eb-9069-9504d4261d1d)

![checbox3](https://media.github.ncsu.edu/user/15271/files/98a07a00-ad43-11eb-80b7-353050ffcba7)

### Canary Analysis

As part of this analysis, we setup a local environment with three VMs (blue, green and proxy). We also setup a redis-client on the proxy vm to subscribe to the channel of the agents pushed into the blue and green vm.

![Canary_Setup](https://media.github.ncsu.edu/user/6557/files/a4149500-ad85-11eb-94a0-ace2bd1e6e99)

Initially we ran the ```pipeline canary master broken``` command through which we cloned the master branch of the micro-service on blue vm and broken branch on green vm. The command also generates trffic to the blue and green instances and collects metrics from them. It finally performs te canary analysis based on the metrics it received back from the agents and logs a summary in the end.

Response from Blue vm url that has master branch

![Canary_Blue_Master](https://media.github.ncsu.edu/user/6557/files/a4149500-ad85-11eb-8379-fcfad1e84e7d)

Response from Green vm url that has broken branch

![Canary_Green_Broken](https://media.github.ncsu.edu/user/6557/files/a4149500-ad85-11eb-9518-6542c6ff6b15)

Canary failed for Master-Broken

![Canary_FAIL](https://media.github.ncsu.edu/user/6557/files/a4149500-ad85-11eb-8856-8546e28c6a39)

We also ran the ```pipeline canary master master``` command through which we cloned the master branch on both vms and performed canary analysis.

Canary passed for Master-Master

![Canary_PASS](https://media.github.ncsu.edu/user/6557/files/a4149500-ad85-11eb-8017-9ee2cc6b44ad)


## Challenges

   * Setting the ssh key fingerprint in digital ocean, as we were intitally trying to send private key as a post parameter and later reliased fingerprint was to be sent. 

   * 404 error when trying to access iTrust on production instance. tomcat logs indicates that iTrust was deployed and running properly, however unable to reach in browser.

   * Establishing connection between the proxy and agents was initially challenging. 

## Screencast

* Below are the links demonstrating running of code for the Milestone 3 

    [Milestone 3](https://drive.google.com/file/d/196ToTxEJJD8BbFZs8U_Vf-lUK9Y8bcJT/view?usp=sharing)

## Checkpoint

* [Checkpoint](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-02/blob/master/CHECKPOINT.md)

## References

- https://github.com/geerlingguy/ansible-role-jenkins
- https://www.npmjs.com/package/jenkins
- https://github.com/joyent/node-sshpk
