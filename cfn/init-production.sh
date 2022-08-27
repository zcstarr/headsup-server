#!/bin/bash

aws cloudformation create-stack \
    --stack-name headsup-server-production-beanstalk-stack \
    --template-body file://cfn/headsup-server.cfn.json \
    --parameters file://cfn/production-launch-params.json \
    --capabilities CAPABILITY_IAM \
    --disable-rollback \
    --region us-east-2 || true

aws cloudformation wait stack-create-complete \
    --stack-name headsup-server-production-beanstalk-stack \
    --region us-east-2 || true
