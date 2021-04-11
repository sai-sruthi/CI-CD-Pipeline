# DEVOPS-02

## Team Details: 

* Sai Sruthi Talluri - stallur2
* Srini Iyer - sbiyer
* Sakthi Murugan - srmuruga

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

The following image shows the output for 100 test suite runs

![image2](https://media.github.ncsu.edu/user/16063/files/9f97b200-9895-11eb-83bc-727bad7c9d27)


## Challenges
- Configuring the build environment particularly Mysql for the iTrust application was initially difficult. 
- Parsing through the job's console log to identify root cause of build failures was challenging.


## Screencast

* Below are the links demonstrating running of code for the Milestone 2 in parts

    [Milestone 2 Fuzzing](https://drive.google.com/file/d/1hEWq7X0Geg1v04PX8ktQfztSqsGMFJFn/view?usp=sharing)

## Checkpoint

* [Checkpoint](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-02/blob/master/CHECKPOINT.md)

## References

- https://github.com/geerlingguy/ansible-role-jenkins
- https://www.npmjs.com/package/jenkins
