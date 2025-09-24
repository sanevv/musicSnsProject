FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY build/libs/music-sns-project-0.0.1-SNAPSHOT-plain.war app.war
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.war"]

#Dockerfile 은 Docker 이미지를 만들기 위한 “설명서(스크립트 파일)” 이다.
#
#즉,
#어떤 기반 이미지를 사용할지,
#어떤 파일을 복사할지,
#어떤 명령을 실행할지
#어떤 포트를 열지
#등을 단계별로 명시해 두는 파일이다.
#
#Docker 는 이 Dockerfile을 읽어서 한 층씩 쌓아 올리며 새로운 Docker 이미지를 만든다.
#그리고 그 이미지를 컨테이너로 실행하면 된다.
#
#쉽게 말하면
#Dockerfile : 레시피(조리법)
#Docker image : 레시피로 만든 음식(컨테이너 실행 가능한 상태)
#Docker container : 그 이미지를 실제 실행한 상태(동작 중인 프로그램)
#이렇게 보면 된다.

# FROM eclipse-temurin:17-jdk
#기반 이미지(Base Image)를 지정하는 것인데,
#eclipse-temurin:17-jdk 은 Java 17 JDK 가 설치되어 있는 공식 OpenJDK 이미지 이다.
#이 이미지 위에 추가로 우리 애플리케이션을 올려서 실행하게 된다.

#WORKDIR /app
#작업 디렉토리를 /app 으로 설정한다.
#
#이후 명령어들은 이 디렉토리 기준으로 실행된다.
#(cd /app 과 같은 역할)

#COPY build/libs/devops_02-0.0.1-SNAPSHOT.jar app.jar
#호스트(로컬 컴퓨터)의 build/libs/devops_02-0.0.1-SNAPSHOT.jar 파일을
#컨테이너의 /app 디렉토리에 app.jar 이름으로 복사한다.

#즉 jar 파일 이름이 길어서 컨테이너 내부에서는 app.jar 로 간단히 사용하려고 이름을 바꿔서 복사한다.

#EXPOSE 8080
#컨테이너가 8080 포트를 사용한다는 것을 Docker에 알려준다.
#
#단, 이것은 “정보 표시”용이며 실제로 호스트와 연결하려면 docker run -p 8080:8080 같은 명령에서 포트 매핑을 해주어야 한다.

#ENTRYPOINT [ "java","-jar","app.jar" ]
#컨테이너가 실행될 때 기본적으로 수행할 명령어(프로세스) 를 지정한다.
#
#여기서는
#java -jar app.jar 을 실행하여 Spring Boot 애플리케이션을 실행한다.