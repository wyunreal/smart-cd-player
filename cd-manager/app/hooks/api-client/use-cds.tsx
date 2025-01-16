import { useEffect, useState } from "react";

const useCds = () => {
  const [cds, setCds] = useState(null);
  useEffect(() => {
    fetch("/api/cds").then((response) => {
      response.json().then((json) => {
        setCds(json.cds);
      });
    });
  }, []);

  return cds;
};

export default useCds;
