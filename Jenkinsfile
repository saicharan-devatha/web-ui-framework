#!/usr/bin/env groovy
pipeline {
    agent {
         dockerfile {
			label 'docker'
			filename 'Dockerfile'
			additionalBuildArgs '--build-arg HOST_USERS_GROUP_ID="`getent group users | cut -d: -f3`"'
			reuseNode true
		 }
    }
    options {
         buildDiscarder(logRotator(numToKeepStr: '30'))
    }
    environment {
        HOME = '.'
        SLACK_NOTIFY = "#alerts-automation"
    }
    stages {
        stage('Install') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run') {
            steps {
                sh 'npm run ${SUITENAME}'
            }
        }
        stage('Report') {
            steps {
               publishHTML target: [
                     reportName: 'Automation Report',
                     reportDir: '.',
                     allowMissing: false,
                     alwaysLinkToLastBuild: false,
                     keepAll: false,
                     reportFiles: 'report.html,report-final.html'
               ]
            }
        }
    }
    post {
	    always {
		    junit '*.xml'
        }
        failure {
            slackSend channel: "${SLACK_NOTIFY}", color: 'danger', message: "${env.JOB_NAME} - Failed! <${env.BUILD_URL}|Check build>"
        }
        unstable {
            slackSend channel: "${SLACK_NOTIFY}", color: 'warning', message: "${env.JOB_NAME} - Unstable! <${env.BUILD_URL}|Check build>"
        }
        success {
            slackSend channel: "${SLACK_NOTIFY}", color: 'good', message: "${env.JOB_NAME} - Passed! <${env.BUILD_URL}|Details>"
        }
        cleanup {
            /*Workspace cleanup*/
            cleanWs(
                deleteDirs: true,
                notFailBuild: true
            )
        }
    }
}
