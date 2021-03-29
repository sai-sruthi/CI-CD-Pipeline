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
    
## Checkpoint

* [Checkpoint](https://github.ncsu.edu/cscdevops-spring2021/DEVOPS-02/blob/master/CHECKPOINT.md)

## References

- https://github.com/geerlingguy/ansible-role-jenkins
- https://www.npmjs.com/package/jenkins
