pipeline {
    agent any

    environment {
        
        FRONTEND_IMAGE = "monavenir-frontend"
        BACKEND_IMAGE = "monavenir-server"
    }

    stages {
        // Checkout the code from GitHub
        stage('Checkout') {
            steps {
                git url: 'https://github.com/SaberMefteh/MonAvenir.git'
            }
        }

        // Build the frontend and backend images
        stage('Build') {
            steps {
<<<<<<< HEAD
                //build the frontend image
                sh 'docker build -t monavenir-frontend ./frontend'
                //build the server image
                sh 'docker build -t monavenir-server ./server'
            } 
        }

       
=======
                script {
                    try {
                        dir('frontend') {   
                            sh "npm install"
                            sh "npm run build"
                            sh "docker build -t $FRONTEND_IMAGE:latest ."
                        }
                        dir('server') {
                            sh "npm install"
                            sh "npm run build"
                            sh "docker build -t $BACKEND_IMAGE:latest ."
                        }
                    } catch (Exception e) {
                        error "Docker build failed: ${e.message}"
                        
                    }
                }
            }
        }

        // Push images to registry (optional but recommended)
        stage('Push to Registry') {
            steps {
                script {
                    
                }
            }
        }


        stage('test') {
            steps {
                script {
                    
                }
            }
        }
>>>>>>> 6cff84a (initial commit)






        stage('deploy') {
            steps {
                script {
                    
                }
            }
        }


    }

    post {
        always {
            cleanWs() // Cleans up the workspace after the pipeline runs
        }
    }
}
