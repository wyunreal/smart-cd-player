const helpTopics = {
    helpCon: {
        sectionId: 'help-con-header',
        title: 'Wifi connection',
        description:
            'Wifi connection should be configured to allow the module to connect to the internet.',
        content: (
            <>
                <p>
                    When configured to connect to a home router, the device will
                    try to stablish a connection to the router that emits the
                    entered SSID.
                </p>
                <p>
                    If the module fails to connect to the router, you can press
                    the built in wifi button to make the module start its own
                    wifi configuration connection.
                </p>
            </>
        ),
    },
    helpStatic: {
        sectionId: 'help-static-header',
        title: 'Static IP',
        description:
            'The Static IP configuration will be used only when device is connected in Client mode.',
        content: (
            <>
                <p>
                    Static IP: This will be the IP address the device will have
                    on the network. You can use this IP to directly connect to
                    the device using a browser.
                </p>
                <p>
                    Gateway: This is the IP address of your Wifi router. It will
                    be used to access to the Internet.
                </p>
                <p>
                    Subnet mask: This is the typology of your wifi network,
                    normally 255.255.255.0 or 255.0.0.0.
                </p>
            </>
        ),
    },
};

export default helpTopics;
