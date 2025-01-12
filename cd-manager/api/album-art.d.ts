declare module "album-art" {
  function albumArt(
    title: string,
    options: { album?: string; size: "small" | "big" }
  ): Promise<string>;
  export = albumArt;
}
