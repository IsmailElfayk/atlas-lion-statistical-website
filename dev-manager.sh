#!/bin/bash

# Open terminals and run npm run dev in each folder

folders=("frontend" "backend")

for folder in "${folders[@]}"
do
    if [ -d "$folder" ]; then
        gnome-terminal -- bash -c "
            echo 'Starting $folder...';
            cd \"$folder\";
            npm run dev;
            exec bash"
    else
        echo "Folder $folder not found!"
    fi
done
