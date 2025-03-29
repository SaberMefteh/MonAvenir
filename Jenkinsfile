pipeline {
    agent any

    environment {
        // Defining environment variables for ease of use
        GIT_REPO = "https://github.com/SaberMefteh/MonAvenir.git"  // GitHub repo URL
    }

    stages {
        stage('Checkout') {
            steps {
                echo "Cloning repository from GitHub..."

                // Checkout the repository
                checkout scm
                // or explicitly specify:
                // git url: 'https://github.com/yourusername/your-repo.git', branch: 'main'

                echo "Repository cloned successfully!"
            }
        }
    }
}
