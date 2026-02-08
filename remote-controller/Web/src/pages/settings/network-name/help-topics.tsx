const helpTopics = {
    helpName: {
        sectionId: 'help-net-name-header',
        title: "Module's network name",
        description:
            'A descriptive name you can use to access the module, using a browser.',
        content: (
            <>
                <p>
                    To access the module's configuration and management webpage,
                    you can use the module's IP address or the name entered on
                    this setting. Just type the following on the browser's
                    address box:
                </p>
                <p>
                    <b>http://entered-module-network-name.local</b>
                </p>
                <p>
                    Where entered-module-network-name is the name you have
                    configured on this setting.
                </p>
            </>
        ),
    },
};

export default helpTopics;
