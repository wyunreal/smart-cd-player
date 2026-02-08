import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from 'App';
import { StoreContextProvider } from 'store';
import { ApiContextProvider } from 'api-client';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <BrowserRouter basename={''}>
        <ApiContextProvider>
            <StoreContextProvider>
                <App />
            </StoreContextProvider>
        </ApiContextProvider>
    </BrowserRouter>,
);
