pipeline {
    agent any

    environment {
        // Defining environment variables for ease of use
        DOCKER_REGISTRY = "localhost:8082/monavenir"  
        NEXUS_CREDENTIALS_ID = "nexus-credentials"  
        NODE_VERSION = "22"  
        IMAGE_NAME_BACKEND = "backend"  
        IMAGE_NAME_FRONTEND = "frontend" 
        IMAGE_TAG = "${env.BUILD_NUMBER}" 
        SONARQUBE_URL = "http://localhost:9000"  
        SONARQUBE_TOKEN = "squ_986fb332547bf5a06e978c42b3a481d4ca2247bd"  
    }

    triggers {
        // Trigger the pipeline automatically on changes in the GitHub repository
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps { 
                echo "Checking out the source code from the Git repository aassleema..."
                checkout scm  // Checks out the repository defined by the pipeline's Git source
            }
        }

        stage('Build Application') {
            steps {
                echo "Starting the build process for the MERN e-learning platform..."

                // Install and build backend
                dir('server') {
                    echo "Installing backend dependencies..."
                    sh "npm install"
                    echo "Building backend application..."
                    sh "npm run build"
                }

                // Install and build frontend
                dir('frontend') {
                    echo "Installing frontend dependencies..."
                    sh "npm install"
                    echo "Building frontend application..."
                    sh "npm run build"
                }

                echo "Build stage completed successfully!"
            }
        }





        
        stage('SonarQube Analysis') {
            steps {
                echo "Running SonarQube analysis..."

                // Run SonarQube analysis for both frontend and backend
                dir('server') {
                    withSonarQubeEnv('SonarQube') {  // 'SonarQube' is the SonarQube server configured in Jenkins
                        sh "sonar-scanner -Dsonar.projectKey=backend -Dsonar.sources=src -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN}"
                    }
                }

                dir('frontend') {
                    withSonarQubeEnv('SonarQube') {
                        sh "sonar-scanner -Dsonar.projectKey=frontend -Dsonar.sources=src -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_TOKEN}"
                    }
                }

                echo "SonarQube analysis completed!"
            }
        }



        
