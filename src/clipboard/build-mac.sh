# Compile for x86_64 (Intel)
swiftc -target x86_64-apple-macosx11.0 clipboard-event-handler-mac.swift -o clipboard-event-handler-mac_x86_64

# Compile for arm64 (Apple Silicon)
swiftc -target arm64-apple-macosx11.0 clipboard-event-handler-mac.swift -o clipboard-event-handler-mac_arm64

lipo -create -output clipboard-event-handler-mac clipboard-event-handler-mac_x86_64 clipboard-event-handler-mac_arm64

rm clipboard-event-handler-mac_x86_64 clipboard-event-handler-mac_arm64

mv clipboard-event-handler-mac ../../assets/clipboard-sync

