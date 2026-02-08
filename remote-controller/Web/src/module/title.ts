const getModuleTitle = () => {
    if (process.env.REACT_APP_MODULE === 'ExampleModule') {
        return 'Example module';
    }
    if (process.env.REACT_APP_MODULE === 'CDPlayerModule') {
        return 'CD player remote';
    }
    return 'Smart home';
};

export default getModuleTitle;
