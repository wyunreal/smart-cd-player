#include "ReadingResponseBuilder.h"

#ifdef MAX_ENTITIES_COUNT

int ReadingResponseBuilder::getReadingsCount(EntityReader* reader, const char *entityType)
{
    return reader->getReadingsCount(entityType);
}

void ReadingResponseBuilder::fillReadingType(EntityReader* reader, int readingIndex, const char *entityType, char *output)
{
    reader->fillReadingType(readingIndex, entityType, output);
}

#endif