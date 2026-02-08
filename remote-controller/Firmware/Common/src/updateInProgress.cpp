#include "updateInProgress.h"

bool updateInProgress = false;

bool isUpdateInProgress()
{
    return updateInProgress;
}

void setUpdateInProgress(bool value){
    updateInProgress = value;
}