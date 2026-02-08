Import("env")
import shutil, pathlib, gzip

def copy_data(src, dst):
  ext = pathlib.Path(src).suffix[1:]
  if (ext in ["js", "css", "html", "htm", "svg", "ico", "txt", "json"]):
    with open(src, 'rb') as src, gzip.open(dst + ".gz", 'wb') as dst:
      for chunk in iter(lambda: src.read(4096), b""):
        dst.write(chunk)
  else:
    shutil.copy(src, dst)

def copy_gzip_data(source, target, env):
  data = env.get("PROJECT_DATA_DIR")
  shutil.copytree(data[:-3], data, copy_function=copy_data)

def del_gzip_data(source, target, env):
  data = env.get("PROJECT_DATA_DIR")
  shutil.rmtree(data, True)

env.AddPreAction("$BUILD_DIR/spiffs.bin", copy_gzip_data)
env.AddPostAction("$BUILD_DIR/spiffs.bin", del_gzip_data)