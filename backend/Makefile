.SILENT:

## RECOMMENDED

obr:
	docker compose run --rm --service-ports --name "obr-service" owlbearrodeo

## DEVELOPER HELPERS

new: 
	docker compose run --service-ports --name "obr-service" owlbearrodeo

build: 
	docker compose build --no-cache owlbearrodeo

start: 
	docker start obr-service

stop:
	docker stop obr-service

dev:
	docker compose rm -s -f owlbearrodeo && make start

remove:
	docker rm obr-service