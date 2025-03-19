pipeline {
    agent any
    stages {
        //stage of checkout the code from github
        stage('checkout') {
            steps {
                git url: 'https://github.com/SaberMefteh/MonAvenir.git'
            }
    
        }

        //stage of build the frontend and server images
        stage('build') {
            steps {
                //build the frontend image
                sh 'docker build -t monavenir-frontend ./frontend'
                //build the server image
                sh 'docker build -t monavenir-server ./server'
            }
        }

        //stage of push the images to Nexus
        stage('push to nexus') {
            steps {
                
            }
        }

        //stage of test the application
        stage('test') {
            steps {
                sh 'npm run test'
            }
        }

    
    }

}
