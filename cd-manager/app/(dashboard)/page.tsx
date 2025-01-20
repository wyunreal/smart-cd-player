"use client";

import React, { CSSProperties } from "react";
import { useSnapCarousel } from "react-snap-carousel";

const styles = {
  root: {},
  scroll: {
    position: "relative",
    display: "flex",
    overflow: "auto",
    scrollSnapType: "x mandatory",
  },
  item: {
    width: "600px",
    height: "600px",
    flexShrink: 0,
  },
  itemSnapPoint: {
    scrollSnapAlign: "center",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  nextPrevButton: {},
  nextPrevButtonDisabled: { opacity: 0.3 },
  pagination: {
    display: "flex",
  },
  paginationButton: {
    margin: "10px",
  },
  paginationButtonActive: { opacity: 0.3 },
  pageIndicator: {
    display: "flex",
    justifyContent: "center",
  },
} satisfies Record<string, CSSProperties>;

interface CarouselProps<T> {
  readonly items: T[];
  readonly renderItem: (
    props: CarouselRenderItemProps<T>
  ) => React.ReactElement<CarouselItemProps>;
}

interface CarouselRenderItemProps<T> {
  readonly item: T;
  readonly isSnapPoint: boolean;
}

export const Carousel = <T extends any>({
  items,
  renderItem,
}: CarouselProps<T>) => {
  const {
    scrollRef,
    pages,
    activePageIndex,
    hasPrevPage,
    hasNextPage,
    prev,
    next,
    goTo,
    snapPointIndexes,
  } = useSnapCarousel();
  return (
    <div style={styles.root}>
      <ul style={styles.scroll} ref={scrollRef}>
        {items.map((item, i) =>
          renderItem({
            item,
            isSnapPoint: snapPointIndexes.has(i),
          })
        )}
      </ul>
      <div style={styles.controls} aria-hidden>
        <button
          style={{
            ...styles.nextPrevButton,
            ...(!hasPrevPage ? styles.nextPrevButtonDisabled : {}),
          }}
          onClick={() => prev()}
          disabled={!hasPrevPage}
        >
          Prev
        </button>

        <button
          style={{
            ...styles.nextPrevButton,
            ...(!hasNextPage ? styles.nextPrevButtonDisabled : {}),
          }}
          onClick={() => next()}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </div>
      <div style={styles.pageIndicator}>
        {activePageIndex + 1} / {pages.length}
      </div>
    </div>
  );
};

interface CarouselItemProps {
  readonly isSnapPoint: boolean;
  readonly children?: React.ReactNode;
}

export const CarouselItem = ({ isSnapPoint, children }: CarouselItemProps) => (
  <li
    style={{
      ...styles.item,
      ...(isSnapPoint ? styles.itemSnapPoint : {}),
    }}
  >
    {children}
  </li>
);

const items = Array.from({ length: 500 }).map((_, i) => ({
  id: i,
  src: `https://picsum.photos/500?idx=${i}`,
}));

const Page = () => (
  <Carousel
    items={items}
    renderItem={({ item, isSnapPoint }) => (
      <CarouselItem key={item.id} isSnapPoint={isSnapPoint}>
        <img src={item.src} width="600" height="600" alt="" />
      </CarouselItem>
    )}
  />
);

export default Page;
