import NowPlayingScreen from "@/app/components/client/now-playing-screen";
import NowPlayingCdList from "@/app/components/client/now-playing-screen/now-playing-cd-list";

const HomePage = () => {
  return (
    <>
      <NowPlayingScreen />
      <NowPlayingCdList />
    </>
  );
};

export default HomePage;
