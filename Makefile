ECHO_SUCCESS=@echo " \033[1;32m✔\033[0m  "

all: startcontainer

startcontainer:
	@mkdir docker/.tmp
	@cp -r common docker/.tmp/
	@cp -r config docker/.tmp/
	@cp -r data docker/.tmp/
	@cp -r example docker/.tmp/
	@cp -r front docker/.tmp/
	@cp -r img docker/.tmp/
	@cp -r server docker/.tmp/
	@cp -r test docker/.tmp/
	@cp -r tools docker/.tmp/
	@cp package.json docker/.tmp/
	@cd docker && docker build -t ants/citycore:v1 .
	@rm -rf docker/.tmp
	@docker run -d -p 9000:9000 -v /data/city-core:/data/city-core ants/citycore:v1
	$(ECHO_SUCCESS) "Succesfully launched city-core api container."




