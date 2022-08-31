# Headsup Server - Takes feedhead.xyz nfs and turns them into RSS feeds 

## About

Headsup feeds server infrastructure support for image uploading and then rss feed 
generation from token data.
## How's it work
![dataflow](https://user-images.githubusercontent.com/173187/187662134-a1e79061-8bab-4741-b501-b535ba35587c.png)

We take feed request via GET /feed/{feedAddr}/rss and parse and sanitize it 
to then make legible HTML.

We also ingest IPFS uploads and produce JSONURLs for the client to then 
submit with request to mint tokens and set metadata.

This is most easily triggable from https://github.com/zcstarr/headsup for test instructions see the [headup repo](https://github.com/zcstarr/headsup)

### Getting Started

### Caveat
Doing this requires a (PINATA_KEY)[https://pinata.cloud] a deployed version is already up and running
at https://api.feedhead.xyz
#### Launching your own local server

```sh
git clone git@github.com:zcstarr/headsup-server.git
cd headsup-server
npm install
PINATA_API_KEY=yourkey PINATA_SECRET=yoursecret npm run start
# you will see 
# Starting Server
```

### Deployment 
Deployment uses CI with circle ci and is currently deployed via cloudformation configuration and elasticbeanstalk.

### Team
Zane Starr - zane[at]gmail.com




