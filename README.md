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
$ `npm install`

## Pipeline Commands 

#### Configure jenkins and the build environment
$ `pipeline setup`

#### Trigger a build job (named checkbox.io), wait for output, and print the build log.
$ `pipeline build checkbox.io -u <admin> -p` <admin>

## Setup

As part of the setup command:
- The .vault-pass files are copied to the home directory of the VM.


## Challenges

- jenkins plugins installation timeouts
- duration of ansible install resulted in long setup runs
- python upgrade forced us to change ansible install approach
- handling asynchronous events in ansible playbook tasks such as jenkins restarts, plugin installs, http requests
- jenkins-job-builder did not support clear text password in jenkins.ini file. It required api token to be generated
