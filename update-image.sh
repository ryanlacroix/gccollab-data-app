#!/bin/bash

sudo docker build -t data-app .
sudo docker tag data-app ryanlacroix/gccollab-data-app
sudo docker push ryanlacroix/gccollab-data-app
