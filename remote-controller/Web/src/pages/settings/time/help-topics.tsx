const helpTopics = {
    helpZone: {
        sectionId: 'time-zone-section',
        title: 'Time zone',
        description:
            'The time zone is required to make the module properly use the local time.',
        content: (
            <>
                <p>
                    Your should search your timezone from the list and then
                    enter your city name on the <b>city field</b>. If everything
                    is right, you will see the current local time displayed on
                    the map.
                </p>
                <p>
                    If your city is not found, just add it by pressing enter on
                    the keyboard after typing it on the field.
                </p>
            </>
        ),
    },
    helpServer: {
        sectionId: 'server-section',
        title: 'Time server',
        description:
            'The time server is used to get the current time when the module reboots.',
        content: (
            <>
                <p>
                    You should not change this value unless required by the
                    module.
                </p>
            </>
        ),
    },
};

export default helpTopics;
