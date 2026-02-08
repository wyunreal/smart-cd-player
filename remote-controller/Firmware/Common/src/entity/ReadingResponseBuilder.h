#ifndef READING_RESPONSE_BUILDER_H
#define READING_RESPONSE_BUILDER_H

#include "Reader.h"

#ifdef MAX_ENTITIES_COUNT

class ReadingResponseBuilder
{
    public:
    int getReadingsCount(EntityReader* reader, const char *entityType);
    void fillReadingType(EntityReader* reader, int readingIndex, const char *entityType, char *output);
};

#endif
#endif