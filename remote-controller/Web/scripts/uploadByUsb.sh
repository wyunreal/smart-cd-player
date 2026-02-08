#!/bin/sh

# Usage:
# ./uploadByUsb.sh moduleName

if [ -z "$1" ]
then
    echo "\$You need to pass a valid module name"
else
    echo "\e[33mDeleting useless files...\e[0m\n"

    cd build/
    rm *.js.LICENSE.txt

    echo "\e[33mGenerating SPIFFS image...\e[0m\n"

    cd ../../Firmware/Modules/$1/data/ && rm -rf * && cd ../../../../Web/ && cp -rf build/* ../Firmware/Modules/$1/data/ && cd ../Firmware/Modules/$1/ && platformio run --target buildfs --environment woroom_wroom32
    cd ../../../
    cp -rf ./Web/data/* ./Firmware/Modules/$1/data/

    if [ -n "$2" ]
    then
        echo "\e[33mUploading SPIFFS image to target via USB...\e[0m\n"
        cd ./Firmware/Modules/$1/
        platformio run --target uploadfs --environment woroom_wroom32
    fi
fi
